import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import AppNavigator from "./src/navigation/AppNavigator";
import SmsForwarder from "./src/components/SmsForwarder";

import { initializeDatabase } from "./src/services/databaseService";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("[APP] Initializing...");

        await initializeDatabase();

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />

      <NavigationContainer>
        <AppNavigator />
        <SmsForwarder />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}