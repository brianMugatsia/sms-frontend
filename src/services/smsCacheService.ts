import {
  getCachedSMSList,
  CachedSMS,
  deleteCachedSMS,
  clearCache,
} from "./databaseService";

/**
 * ============================================================
 * Dashboard Cache Service
 * ============================================================
 * This service is READ-ONLY.
 * It never forwards SMS. It simply exposes cached SMS to the UI.
 * ============================================================
 */

/**
 * Deletes a single SMS from the local SQLite cache.
 */
export const deleteCachedSms = async (id: string): Promise<void> => {
  try {
    await deleteCachedSMS(id);
  } catch (error) {
    console.error("[CACHE] Failed to delete local cached SMS:", error);
  }
};

/**
 * Clears all SMS from the local SQLite cache.
 */
export const clearCachedSms = async (): Promise<void> => {
  try {
    await clearCache();
  } catch (error) {
    console.error("[CACHE] Failed to clear local cached SMS:", error);
  }
};

/**
 * Returns all cached SMS.
 */
export const getDashboardSMS = async (): Promise<CachedSMS[]> => {
  try {
    return await getCachedSMSList();
  } catch (error) {
    console.error("[CACHE] Failed to load cached SMS:", error);
    return [];
  }
};

/**
 * Returns number of cached SMS.
 */
export const getDashboardCount = async (): Promise<number> => {
  try {
    const sms = await getCachedSMSList();
    return sms.length;
  } catch (error) {
    console.error("[CACHE] Failed to count SMS:", error);
    return 0;
  }
};

/**
 * Returns the newest cached SMS.
 */
export const getLatestSMS = async (): Promise<CachedSMS | null> => {
  try {
    const sms = await getCachedSMSList();
    if (sms.length === 0) return null;
    return sms[0];
  } catch (error) {
    console.error("[CACHE] Failed to get latest SMS:", error);
    return null;
  }
};

/**
 * Prints the cache to Logcat.
 */
export const printCache = async (): Promise<void> => {
  const items = await getDashboardSMS();
  console.log("============== SMS CACHE ==============");
  console.log(`Total Cached SMS: ${items.length}`);

  if (items.length === 0) {
    console.log("[CACHE] Empty");
    console.log("=======================================");
    return;
  }

  items.forEach((sms, index) => {
    console.log(`SMS #${index + 1}`);
    console.log(`Sender      : ${sms.sender}`);
    console.log(`Message     : ${sms.message}`);
    console.log(`Status      : ${sms.status}`);
    console.log(`Forwarded   : ${sms.forwarded ? "Yes" : "No"}`);
    console.log(`Received At : ${new Date(sms.received_at).toLocaleString()}`);
    console.log("---------------------------------------");
  });
  console.log("=======================================");
};