import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Sms } from "../types/sms";

export default function SmsItem({
  sms,
  onToggleRead,
  onDelete,
}: {
  sms: Sms;
  onToggleRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <View style={[styles.card, !sms.read && styles.unread]}>
      {/* Sender */}
      <Text style={styles.sender}>
        {!sms.read ? "📩 " : "✉️ "} {sms.sender}
      </Text>

      {/* Message body */}
      <Text style={styles.message}>{sms.message}</Text>

      {/* Metadata */}
      <View style={styles.metaContainer}>
        <Text style={styles.meta}>Device: {sms.device_id}</Text>
        {sms.forwarded_by && (
          <Text style={styles.meta}>Forwarded by: {sms.forwarded_by}</Text>
        )}
        {sms.role && <Text style={styles.meta}>Role: {sms.role}</Text>}
        {sms.timestamp && !isNaN(new Date(sms.timestamp).getTime()) && (
          <Text style={styles.meta}>
            Time: {new Date(sms.timestamp).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {onToggleRead && (
          <TouchableOpacity
            onPress={() => onToggleRead(sms.id)}
            style={[styles.button, { backgroundColor: "#007AFF" }]}
          >
            <Text style={styles.buttonText}>
              {sms.read ? "Mark Unread" : "Mark Read"}
            </Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(sms.id)}
            style={[styles.button, { backgroundColor: "red" }]}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unread: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  sender: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
    color: "#333",
  },
  message: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  metaContainer: {
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
