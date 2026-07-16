import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export interface CachedSMS {
  id: string;
  sender: string;
  message: string;
  device_id: string;
  received_at: number;
  timestamp: string;
  status: string;
  forwarded: number;
  response_code: number | null;
  error: string | null;
  cached_at: number;
}

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("sms_forwarder.db");
  }
  return db;
};

export const initializeDatabase = async () => {
  try {
    const database = await getDatabase();
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS sms_cache (
          id TEXT PRIMARY KEY NOT NULL,
          sender TEXT NOT NULL,
          message TEXT NOT NULL,
          device_id TEXT NOT NULL,
          received_at INTEGER NOT NULL,
          timestamp TEXT NOT NULL,
          status TEXT NOT NULL,
          forwarded INTEGER NOT NULL DEFAULT 0,
          response_code INTEGER,
          error TEXT,
          cached_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sms_cache_received
      ON sms_cache(received_at);
    `);
    console.log("[DB] SQLite initialized");
  } catch (error) {
    console.error("[DB] Initialization failed:", error);
    throw error;
  }
};

export const upsertCachedSMS = async (sms: CachedSMS): Promise<void> => {
  const database = await getDatabase();
  try {
    await database.runAsync(
      `
      INSERT INTO sms_cache (
        id, sender, message, device_id, received_at,
        timestamp, status, forwarded, response_code, error, cached_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        sender = excluded.sender,
        message = excluded.message,
        device_id = excluded.device_id,
        received_at = excluded.received_at,
        timestamp = excluded.timestamp,
        status = excluded.status,
        forwarded = excluded.forwarded,
        response_code = excluded.response_code,
        error = excluded.error,
        cached_at = excluded.cached_at
      `,
      [
        sms.id,
        sms.sender,
        sms.message,
        sms.device_id,
        sms.received_at,
        sms.timestamp,
        sms.status,
        sms.forwarded,
        sms.response_code,
        sms.error,
        sms.cached_at,
      ]
    );
  } catch (error) {
    console.error(`[DB] Upsert failed for ${sms.id}:`, error);
    throw error;
  }
};

export const upsertCachedSMSList = async (items: CachedSMS[]): Promise<void> => {
  for (const item of items) {
    await upsertCachedSMS(item);
  }
  console.log(`[DB] Cached ${items.length} SMS from backend`);
};

export const getCachedSMSList = async (): Promise<CachedSMS[]> => {
  const database = await getDatabase();
  try {
    return await database.getAllAsync<CachedSMS>(
      `
      SELECT *
      FROM sms_cache
      ORDER BY received_at DESC
      `
    );
  } catch (error) {
    console.error("[DB] Fetch cache failed:", error);
    return [];
  }
};

export const findCachedSMS = async (id: string): Promise<CachedSMS | null> => {
  const database = await getDatabase();
  try {
    const sms = await database.getFirstAsync<CachedSMS>(
      `
      SELECT *
      FROM sms_cache
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

export const getCacheSize = async (): Promise<number> => {
  const database = await getDatabase();
  try {
    const result = await database.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(*) AS count
      FROM sms_cache
      `
    );
    return result?.count ?? 0;
  } catch (error) {
    console.error("[DB] Count failed:", error);
    return 0;
  }
};

export const clearCache = async (): Promise<void> => {
  const database = await getDatabase();
  try {
    await database.runAsync(`DELETE FROM sms_cache`);
    console.log("[DB] Cache cleared");
  } catch (error) {
    console.error("[DB] Clear cache failed:", error);
  }
};

export const cleanupOldCachedSMS = async (days: number = 30) => {
  const database = await getDatabase();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  await database.runAsync(
    `
    DELETE FROM sms_cache
    WHERE received_at < ?
    `,
    [cutoff]
  );
  console.log("[DB] Old cached SMS cleaned");
};

export const deleteCachedSMS = async (id: string): Promise<void> => {
  const database = await getDatabase();
  try {
    await database.runAsync(
      `
      DELETE FROM sms_cache
      WHERE id = ?
      `,
      [id]
    );
    console.log(`[DB] Deleted cached SMS with ID: ${id}`);
  } catch (error) {
    console.error(`[DB] Failed to delete cached SMS ${id}:`, error);
    throw error;
  }
};