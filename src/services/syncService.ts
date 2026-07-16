import { listSms } from "./api";

import { isOnline } from "./networkService";

import {
  upsertCachedSMSList,
  getCachedSMSList,
  CachedSMS,
} from "./databaseService";

let syncing = false;

/**
 * Refreshes the dashboard:
 * - If online: pulls the authoritative SMS list from the backend
 *   (including messages forwarded entirely by the native Android
 *   path while the app was closed or killed), and writes it into
 *   the local cache so it's available offline next time.
 * - If offline: falls back to whatever's already cached locally.
 *
 * This function no longer uploads or forwards anything -
 * that responsibility belongs solely to the native pipeline.
 */
export const refreshSmsDashboard = async (): Promise<CachedSMS[]> => {

  if (syncing) {
    console.log("[SYNC] Already running");
    return await getCachedSMSList();
  }

  syncing = true;

  try {

    const online = await isOnline();

    if (!online) {
      console.log("[SYNC] Offline, showing cached SMS");
      return await getCachedSMSList();
    }

    console.log("[SYNC] Refreshing dashboard from backend");

    const { items } = await listSms();

    const now = Date.now();

    const cached: CachedSMS[] = items.map((item: any) => ({
      id: item.id,
      sender: item.sender,
      message: item.message,
      device_id: item.device_id,
      received_at: item.received_at,
      timestamp: item.timestamp,
      status: item.status,
      forwarded: item.forwarded ? 1 : 0,
      response_code: item.response_code ?? null,
      error: item.error ?? null,
      cached_at: now,
    }));

    await upsertCachedSMSList(cached);

    console.log(`[SYNC] Loaded and cached ${cached.length} SMS`);

    return await getCachedSMSList();

  } catch (e) {

    console.log("[SYNC] Failed to refresh dashboard, falling back to cache", e);

    return await getCachedSMSList();

  } finally {

    syncing = false;

  }

};

export const startSyncService = async () => {

  console.log("[SYNC] Starting dashboard sync");

  await refreshSmsDashboard();

};