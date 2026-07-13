import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import notifee from "@notifee/react-native";

import AppNavigator from "./src/navigation/AppNavigator";
import SmsForwarder from "./src/components/SmsForwarder";

import { initializeDatabase } from "./src/services/databaseService";
import { loadContacts } from "./src/services/contactService";

// ============================================================
// Foreground Service Registration
// Must run at module load time, NOT inside a component or
// useEffect — this is what tells Android/notifee that the
// displayed notification actually represents a real foreground
// service, keeping the JS process alive in the background.
// ============================================================
notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    // Intentionally never resolves — the service stays alive
    // until stopForegroundService() is explicitly called.
    console.log("[SERVICE] Foreground service task running");
  });
});

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("[APP] Initializing...");

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