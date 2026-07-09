import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Sms } from "../types/sms";
import { getContactName } from "../services/contactService";

interface Props {
  sms: Sms;
  onToggleRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Decodes the JWT payload (base64url) without pulling in a
// dependency like jwt-decode — we only need the "sub" claim.
function decodeJwtPayload(token: string): any | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    const decoded =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export default function SmsItem({
  sms,
  onToggleRead,
  onDelete,
}: Props) {
  const [contactName, setContactName] =
    useState<string | null>(null);

  const [currentUsername, setCurrentUsername] =
    useState<string | null>(null);

  useEffect(() => {
    setContactName(getContactName(sms.sender));
  }, [sms.sender]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = await AsyncStorage.getItem("token");

      if (!token) return;

      const payload = decodeJwtPayload(token);

      if (payload?.sub) {
        setCurrentUsername(payload.sub);
      }
    };

    loadCurrentUser();
  }, []);

  const formattedTime = sms.timestamp
    ? new Date(sms.timestamp).toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  const avatarLetter = (
    contactName ||
    sms.sender ||
    "?"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <View
      style={[
        styles.card,
        !sms.read && styles.unreadCard,
      ]}
    >
      {/* Header */}

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {avatarLetter}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.sender}>
            {contactName || sms.sender}
          </Text>

          {contactName && (
            <Text style={styles.phone}>
              {sms.sender}
            </Text>
          )}

          <Text style={styles.time}>
            {formattedTime}
          </Text>
        </View>

        {!sms.read && (
          <View style={styles.newBadge}>
            <Text style={styles.badgeText}>
              NEW
            </Text>
          </View>
        )}
      </View>

      {/* Message */}

      <Text style={styles.message}>
        {sms.message}
      </Text>

      {/* Info Chips */}

      <View style={styles.chipsContainer}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            📱 {sms.device_id}
          </Text>
        </View>

        {currentUsername && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              👤 {currentUsername}
            </Text>
          </View>
        )}

        {sms.forwarded_by && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              📤 {sms.forwarded_by}
            </Text>
          </View>
        )}

        {sms.role && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              🛡 {sms.role}
            </Text>
          </View>
        )}
      </View>

      {/* Buttons */}

      <View style={styles.actions}>
        {onToggleRead && (
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: sms.read
                  ? "#ff9800"
                  : "#007AFF",
              },
            ]}
            onPress={() =>
              onToggleRead(sms.id)
            }
          >
            <Text style={styles.buttonText}>
              {sms.read
                ? "Mark Unread"
                : "Mark Read"}
            </Text>
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: "#e53935",
              },
            ]}
            onPress={() =>
              onDelete(sms.id)
            }
          >
            <Text style={styles.buttonText}>
              Delete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  unreadCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#007AFF",
    backgroundColor: "#F8FBFF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },

  sender: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  phone: {
    marginTop: 2,
    fontSize: 13,
    color: "#666",
  },

  time: {
    color: "#777",
    marginTop: 3,
    fontSize: 12,
  },

  newBadge: {
    backgroundColor: "#28a745",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 11,
  },

  message: {
    fontSize: 16,
    color: "#333",
    marginTop: 18,
    lineHeight: 24,
  },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
  },

  chip: {
    backgroundColor: "#EEF4FF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },

  chipText: {
    fontSize: 12,
    color: "#333",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
  },

  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});