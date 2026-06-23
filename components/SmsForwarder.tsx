import React, { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import SmsListener from "react-native-android-sms-listener";
import { forwardSms } from "./services/api";

const SmsForwarder: React.FC = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === "android") {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
      }
    };

    requestPermissions();

    const subscription = SmsListener.addListener(async (message) => {
      console.log("New SMS received:", message);

      try {
        await forwardSms({
          sender: message.originatingAddress,
          message: message.body,
          device_id: "Pixel_5",
        });
        console.log("SMS forwarded successfully");
      } catch (error) {
        console.error("Error forwarding SMS:", error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null; // background component, no UI
};

export default SmsForwarder;
