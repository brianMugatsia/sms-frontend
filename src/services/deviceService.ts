import { Platform } from "react-native";
import * as Application from "expo-application";

let cachedDeviceId: string | null = null;

/**
 * Returns this device's stable identifier - the SAME Settings.Secure.ANDROID_ID
 * that SmsForwardWorker.kt already attaches to every forwarded SMS.
 * Using the same source of truth on both sides is what makes the dashboard's
 * device_id filter actually match the stored SMS records.
 */
export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  if (Platform.OS === "android") {
    const androidId = Application.getAndroidId();
    cachedDeviceId = androidId ?? "unknown-device";
  } else {
    // iOS fallback, in case this project ever ships there -
    // ANDROID_ID has no equivalent, so use the vendor-scoped ID instead.
    cachedDeviceId = (await Application.getIosIdForVendorAsync()) ?? "unknown-device";
  }

  console.log("[DEVICE] Resolved device_id:", cachedDeviceId);
  return cachedDeviceId;
};