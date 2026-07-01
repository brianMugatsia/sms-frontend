import { PermissionsAndroid, Platform } from "react-native";
import SmsListener from "react-native-android-sms-listener";
import { forwardSms } from "./api";

const DEVICE_ID = "Pixel_5";

export const requestSmsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return false;
  }

  try {
    const receiveSms = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
    );

    const readSms = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );

    return (
      receiveSms === PermissionsAndroid.RESULTS.GRANTED &&
      readSms === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.error("Permission request failed:", error);
    return false;
  }
};

export const startSmsForwarding = async () => {
  const granted = await requestSmsPermissions();

  if (!granted) {
    console.warn("SMS permissions denied");
    return null;
  }

  console.log("SMS forwarding started");

  const subscription = SmsListener.addListener(async (message) => {
    console.log("New SMS received:", {
      sender: message.originatingAddress,
      body: message.body,
    });

    try {
      await forwardSms({
        sender: message.originatingAddress ?? "Unknown",
        message: message.body ?? "",
        device_id: DEVICE_ID,
      });

      console.log("SMS forwarded successfully");
    } catch (error) {
      console.error("Error forwarding SMS:", error);
    }
  });

  return subscription;
};

export const stopSmsForwarding = (subscription: any) => {
  try {
    subscription?.remove();
    console.log("SMS forwarding stopped");
  } catch (error) {
    console.error("Error stopping SMS forwarding:", error);
  }
};