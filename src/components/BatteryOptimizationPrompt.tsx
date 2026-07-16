import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { openBatterySettings } from "../services/batteryOptimization";

export default function BatteryOptimizationPrompt() {
  if (Platform.OS !== "android") return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Keep SMS forwarding reliable</Text>
      <Text style={styles.body}>
        For the most reliable background SMS forwarding, disable battery
        optimization for this app:{"\n\n"}
        Tap below → Battery → Unrestricted
      </Text>
      <TouchableOpacity style={styles.button} onPress={openBatterySettings}>
        <Text style={styles.buttonText}>Open App Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#1e1e1e",
    margin: 16,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  body: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2f80ed",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});