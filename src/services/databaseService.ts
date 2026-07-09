import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * ================================
 * SMS Model
 * ================================
 */
export interface PendingSMS {
  id: string;
  sender: string;
  message: string;
  device_id: string;
  received_at: number;
  retries: number;
  synced: number;
  created_at: number;
}

/**
 * ================================
 * Open Database (Singleton)
 * ================================
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("sms_forwarder.db");
  }

  return db;
};

/**
 * ================================
 * Initialize Database
 * ================================
 */
export const initializeDatabase = async () => {
  try {
    const database = await getDatabase();

    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS pending_sms (
          id TEXT PRIMARY KEY NOT NULL,
          sender TEXT NOT NULL,
          message TEXT NOT NULL,
          device_id TEXT NOT NULL,
          received_at INTEGER NOT NULL,
          retries INTEGER NOT NULL DEFAULT 0,
          synced INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_pending_sms_synced
      ON pending_sms(synced);

      CREATE INDEX IF NOT EXISTS idx_pending_sms_created
      ON pending_sms(created_at);

      CREATE INDEX IF NOT EXISTS idx_pending_sms_received
      ON pending_sms(received_at);
    `);

    console.log("[DB] SQLite initialized");
  } catch (error) {
    console.error("[DB] Initialization failed:", error);
    throw error;
  }
};

/**
 * ================================
 * Save SMS
 * ================================
 */
export const saveSMS = async (
  sms: PendingSMS
): Promise<void> => {
  const database = await getDatabase();

  try {
    await database.runAsync(
      `
      INSERT OR IGNORE INTO pending_sms (
        id,
        sender,
        message,
        device_id,
        received_at,
        retries,
        synced,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        sms.id,
        sms.sender,
        sms.message,
        sms.device_id,
        sms.received_at,
        sms.retries,
        sms.synced,
        sms.created_at,
      ]
    );

    console.log(`[DB] Saved SMS ${sms.id}`);
  } catch (error) {
    console.error("[DB] Save failed:", error);
    throw error;
  }
};

/**
 * ================================
 * Pending Queue
 * ================================
 */
export const getPendingSMS = async (): Promise<PendingSMS[]> => {
  const database = await getDatabase();

  try {
    return await database.getAllAsync<PendingSMS>(
      `
      SELECT *
      FROM pending_sms
      WHERE synced = 0
      ORDER BY created_at ASC
      `
    );
  } catch (error) {
    console.error("[DB] Fetch queue failed:", error);
    return [];
  }
};

/**
 * ================================
 * Delete SMS
 * ================================
 */
export const deleteSMS = async (
  id: string
): Promise<void> => {
  const database = await getDatabase();

  try {
    await database.runAsync(
      `
      DELETE FROM pending_sms
      WHERE id = ?
      `,
      [id]
    );

    console.log(`[DB] Deleted ${id}`);
  } catch (error) {
    console.error("[DB] Delete failed:", error);
    throw error;
  }
};

/**
 * ================================
 * Retry Counter
 * ================================
 */
export const increaseRetry = async (
  id: string
): Promise<void> => {
  const database = await getDatabase();

  try {
    await database.runAsync(
      `
      UPDATE pending_sms
      SET retries = retries + 1
      WHERE id = ?
      `,
      [id]
    );
  } catch (error) {
    console.error("[DB] Retry update failed:", error);
  }
};

/**
 * ================================
 * Queue Size
 * ================================
 */
export const getQueueSize = async (): Promise<number> => {
  const database = await getDatabase();

  try {
    const result =
      await database.getFirstAsync<{ count: number }>(
        `
        SELECT COUNT(*) AS count
        FROM pending_sms
        WHERE synced = 0
        `
      );

    return result?.count ?? 0;
  } catch (error) {
    console.error("[DB] Count failed:", error);
    return 0;
  }
};

/**
 * ================================
 * Find SMS by ID
 * ================================
 */
export const findSMS = async (
  id: string
): Promise<PendingSMS | null> => {
  const database = await getDatabase();

  try {
    const sms =
      await database.getFirstAsync<PendingSMS>(
        `
        SELECT *
        FROM pending_sms
        WHERE id = ?
        `,
        [id]
      );

    return sms ?? null;
  } catch (error) {
    console.error("[DB] Lookup failed:", error);
    return null;
  }
};

/**
 * ================================
 * Clear Queue
 * ================================
 */
export const clearQueue = async (): Promise<void> => {
  const database = await getDatabase();

  try {
    await database.runAsync(
      `
      DELETE FROM pending_sms
      `
    );

    console.log("[DB] Queue cleared");
  } catch (error) {
    console.error("[DB] Clear queue failed:", error);
  }
};

/**
 * Remove queued SMS older than X days.
 * These are assumed to be stale.
 */
export const cleanupOldSMS = async (
  days: number = 30
) => {

  const database = await getDatabase();

  const cutoff =
    Date.now() -
    days * 24 * 60 * 60 * 1000;

  await database.runAsync(
    `
    DELETE FROM pending_sms
    WHERE created_at < ?
    `,
    [cutoff]
  );

  console.log("[DB] Old SMS cleaned");
};