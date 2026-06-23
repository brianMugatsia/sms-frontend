import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Sms {
  id: string;
  sender: string;
  message: string;
  device_id: string;
  forwarded_by?: string;
  role?: string;
  read?: boolean;
  timestamp?: string;
}

export default function SmsItem({ sms }: { sms: Sms }) {
  return (
    <View style={[styles.item, !sms.read && styles.unread]}>
      <Text style={styles.sender}>
        {!sms.read ? "📩 " : "✉️ "}
        {sms.sender}
      </Text>
      <Text>{sms.message}</Text>
      <Text style={styles.meta}>Device: {sms.device_id}</Text>
      {sms.forwarded_by && (
        <Text style={styles.meta}>Forwarded by: {sms.forwarded_by}</Text>
      )}
      {sms.role && <Text style={styles.meta}>Role: {sms.role}</Text>}
      {sms.timestamp && (
        <Text style={styles.meta}>Time: {new Date(sms.timestamp).toLocaleString()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { padding: 10, borderBottomWidth: 1, borderColor: "#ccc" },
  unread: { backgroundColor: "#eef6ff" },
  sender: { fontWeight: "bold", marginBottom: 4 },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
});
