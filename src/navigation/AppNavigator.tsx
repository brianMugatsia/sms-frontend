import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import RegisterScreen from "../screens/RegisterScreen";
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ForwardingRulesScreen from "../screens/ForwardingRulesScreen";

export type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  Dashboard: undefined;
  ForwardingRules: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Register"
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
        name="Register"
        component={RegisterScreen}
        options={{
          title: "Create Account",
        }}
      />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: "Sign In",
        }}
      />

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
    </Stack.Navigator>
  );
}