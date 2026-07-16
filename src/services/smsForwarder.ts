import { AppState, PermissionsAndroid, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";

let deviceName = "Android Device";

/**
 * Check (not request) current SMS permission status.
 * Safe to call with no Activity attached (background/headless JS restarts).
 */
export const checkSmsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return false;

  try {
    const receiveGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
    );
    const readGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );

    // On Android 13+ (API 33), check notifications too if your background worker displays them
    let notificationGranted = true;
    if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
      notificationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }

    return receiveGranted && readGranted && notificationGranted;
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
};

/**
 * Request SMS permissions. Only call this when the app is in the
 * foreground (Activity attached) — otherwise it throws E_INVALID_ACTIVITY.
 */
export const requestSmsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return false;

  // Guard: requestMultiple needs a live Activity. If we're not in the
  // foreground (e.g. JS restarted headlessly by the foreground service),
  // fall back to a check instead of crashing init.
  if (AppState.currentState !== "active") {
    console.warn(
      "[PERMISSIONS] App not in foreground, skipping request — using check instead"
    );
    return checkSmsPermissions();
  }

  try {
    console.log("========== REQUESTING SMS PERMISSIONS ==========");

    const permissionsToRequest = [
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    ];

    // Push Notification permission mandatory for background persistence on API 33+
    if (Platform.Version >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    const permissions = await PermissionsAndroid.requestMultiple(permissionsToRequest);

    console.log("Permissions status result:", permissions);

    const smsGranted =
      permissions[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
      permissions[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED;

    if (!smsGranted) {
      console.warn("Core SMS permissions denied");
      return false;
    }

    try {
      deviceName = await DeviceInfo.getDeviceName();
    } catch {
      deviceName = "Android Device";
    }

    console.log("Device profile assigned:", deviceName);
    return true;
  } catch (error) {
    console.error("Permission request failed, falling back to check:", error);
    return checkSmsPermissions();
  }
};

/**
 * Initializes SMS forwarding.
 */
export const startSmsForwarding = async () => {
  console.log("========== SMS FORWARDING INITIALIZED ==========");

  const alreadyGranted = await checkSmsPermissions();
  const granted = alreadyGranted || (await requestSmsPermissions());

  if (!granted) {
    console.warn(
      "SMS permissions incomplete — dashboard init limited, but native SmsReceiver may still work if previously handled at OS level."
    );
    return false;
  }

  console.log(
    "Native WorkManager engine hooked. Worker pipeline safe even if JS engine tears down."
  );

  return true;
};

/**
 * Nothing to stop.
 */
export const stopSmsForwarding = () => {
  console.log("SMS forwarding cleanup (no JS listener tied to component lifecycle)");
};

/**
 * Returns the cached device name if needed elsewhere.
 */
export const getDeviceName = () => deviceName;