import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

import {
  loadSettings,
  saveSettings,
} from "../services/settingsService";

import { ForwardingSettings } from "../types/settings";

export default function ForwardingRulesScreen() {
  const [settings, setSettings] =
    useState<ForwardingSettings | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const s = await loadSettings();
    setSettings(s);
  };

  const update = (
    key: keyof ForwardingSettings,
    value: boolean
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const save = async () => {
    if (!settings) return;

    await saveSettings(settings);

    Alert.alert(
      "Success",
      "Forwarding settings saved."
    );
  };

  if (!settings) {
    return null;
  }

  const Item = ({
    title,
    field,
  }: {
    title: string;
    field: keyof ForwardingSettings;
  }) => (
    <View style={styles.row}>
      <Text style={styles.title}>
        {title}
      </Text>

      <Switch
        value={settings[field]}
        onValueChange={(v) =>
          update(field, v)
        }
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
    >
      <Text style={styles.header}>
        SMS Forwarding Rules
      </Text>

      <Text style={styles.subtitle}>
        Choose which incoming SMS
        messages should be forwarded
        to your dashboard.
      </Text>

      <Item
        title="Forward All SMS"
        field="forwardAll"
      />

      <Item
        title="Banking SMS"
        field="banking"
      />

      <Item
        title="M-Pesa SMS"
        field="mpesa"
      />

      <Item
        title="OTP / Verification"
        field="otp"
      />

      <Item
        title="Messages From Contacts"
        field="contacts"
      />

      <Item
        title="Unknown Numbers"
        field="unknown"
      />

      <Item
        title="Promotional SMS"
        field="promotions"
      />

      <Item
        title="Personal Messages"
        field="personal"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={save}
      >
        <Text
          style={styles.buttonText}
        >
          Save Settings
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },

  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },

  subtitle: {
    color: "#666",
    marginBottom: 25,
    fontSize: 15,
    lineHeight: 22,
  },

  row: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    elevation: 2,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  button: {
    backgroundColor: "#007AFF",
    marginTop: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
});