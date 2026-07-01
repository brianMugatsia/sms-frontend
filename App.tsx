import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import AppNavigator from "./src/navigation/AppNavigator";
import SmsForwarder from "./src/components/SmsForwarder";

export default function App() {
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