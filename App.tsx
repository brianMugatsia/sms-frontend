import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppState, PermissionsAndroid, Platform } from "react-native";
import notifee from "@notifee/react-native";

import AppNavigator from "./src/navigation/AppNavigator";
import SmsForwarder from "./src/components/SmsForwarder";

import { initializeDatabase } from "./src/services/databaseService";
import { loadContacts } from "./src/services/contactService";

// ============================================================
// Foreground Service Registration
// ============================================================
notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    console.log("[SERVICE] Foreground service task running");
  });
});

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("[APP] Initializing...");

        // 1. Request Runtime SMS Permissions (Android Only)
        if (Platform.OS === "android") {
          console.log("[APP] Requesting runtime permissions...");

          // Check first — this never requires an Activity, so it's
          // always safe, including during headless/background JS restarts.
          const alreadyGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
          );

          if (alreadyGranted) {
            console.log("[APP] SMS runtime permission already granted");
          } else if (AppState.currentState === "active") {
            // Only show the request dialog if we know there's a live
            // Activity in the foreground — otherwise this throws
            // E_INVALID_ACTIVITY.
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
              {
                title: "SMS Gateway Permission",
                message:
                  "This app needs background permission to capture incoming SMS messages and forward them to your dashboard server.",
                buttonNegative: "Deny",
                buttonPositive: "Allow",
              }
            );

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              console.log("[APP] SMS runtime permission GRANTED");
            } else {
              console.warn("[APP] SMS runtime permission DENIED by user");
            }
          } else {
            console.warn(
              "[APP] Not in foreground, skipping permission request — will rely on previously granted permission"
            );
          }
        }

        // 2. Initialize local database and contacts
        await initializeDatabase();
        await loadContacts();

        console.log("[APP] Initialization complete");
        setReady(true);
      } catch (error) {
        console.error("[APP] Initialization failed:", error);
      }
    };

    initialize();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />

        <NavigationContainer>
          <AppNavigator />
          <SmsForwarder />
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}