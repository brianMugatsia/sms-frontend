import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import DashboardScreen from "../screens/DashboardScreen";
import ForwardingRulesScreen from "../screens/ForwardingRulesScreen";
import SettingsScreen from "../screens/SettingsScreen";

export type RootStackParamList = {
  Dashboard: undefined;
  ForwardingRules: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#007AFF",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "SMS Dashboard",
        }}
      />

      <Stack.Screen
        name="ForwardingRules"
        component={ForwardingRulesScreen}
        options={{
          title: "Forwarding Rules",
        }}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Storage Settings",
        }}
      />
    </Stack.Navigator>
  );
}