import { PermissionsAndroid, Platform } from "react-native";
import SmsListener from "react-native-android-sms-listener";
import DeviceInfo from "react-native-device-info";

import { forwardSms } from "./api";
import { shouldForward } from "./filterService";

let smsSubscription: any = null;

export const requestSmsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    console.log("Not an Android device");
    return false;
  }

  try {
    console.log("Requesting SMS permissions...");

    const permissions = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_SMS,
    ]);

    console.log("Permissions:", permissions);

    return (
      permissions[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      permissions[PermissionsAndroid.PERMISSIONS.READ_SMS] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error("Permission request failed:", error);
    return false;
  }
};

export const startSmsForwarding = async () => {
  console.log("========== STARTING SMS FORWARDER ==========");

  // Prevent duplicate listeners
  if (smsSubscription) {
    console.log("SMS listener already running");
    return smsSubscription;
  }

  const granted = await requestSmsPermissions();

  if (!granted) {
    console.warn("SMS permissions denied");
    return null;
  }

  let deviceName = "Android Device";

  try {
    deviceName = await DeviceInfo.getDeviceName();
  } catch (error) {
    console.warn("Unable to obtain device name");
  }

  console.log("Device:", deviceName);

  console.log("Registering SMS listener...");

  smsSubscription = SmsListener.addListener(async (message) => {
    console.log("========== SMS RECEIVED ==========");
    console.log(message);

    const sender = message.originatingAddress ?? "Unknown";
    const body = message.body ?? "";

    try {
      const allowed = await shouldForward({
        sender,
        body,
      });

      if (!allowed) {
        console.log("SMS blocked by forwarding rules");
        return;
      }

      console.log("Forwarding SMS to backend...");

      const response = await forwardSms({
        sender,
        message: body,
        device_id: deviceName,
      });

      console.log("Backend response:", response);
      console.log("SMS forwarded successfully");
    } catch (error) {
      console.error("Forwarding failed:", error);
    }
  });

  console.log("SMS listener registered successfully");

  return smsSubscription;
};

export const stopSmsForwarding = () => {
  try {
    if (smsSubscription) {
      smsSubscription.remove();
      smsSubscription = null;
      console.log("SMS forwarding stopped");
    }
  } catch (error) {
    console.error("Error stopping listener:", error);
  }
};