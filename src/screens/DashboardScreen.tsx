import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Image, RefreshControl } from "react-native";
import SmsList from "../components/SmsList";
import SmsForwarder from "../components/SmsForwarder";
import { listSms } from "../services/api";
import { connectWebSocket, disconnectWebSocket } from "../services/websocket";
import { Sms } from "../types/sms";

export default function DashboardScreen() {
  const [messages, setMessages] = useState<Sms[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = async () => {
    try {
      const smsList = (await listSms()) ?? [];
      setMessages(smsList.map(s => ({ ...s, read: s.read ?? false })));
    } catch (err) {
      console.error("Failed to fetch SMS list:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    connectWebSocket((sms: Sms) => {
      if (!sms || !sms.id) return;
      setMessages(prev => [{ ...sms, read: sms.read ?? false }, ...prev]);
    });

    return () => disconnectWebSocket();
  }, []);

  const handleToggleRead = (id: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, read: !m.read } : m))
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <SmsForwarder />

      <Image
        source={require("../../assets/icon.png")}
        style={{
          width: 120,
          height: 120,
          alignSelf: "center",
          marginTop: 20,
          marginBottom: 10,
        }}
      />

      <Text style={{ fontSize: 20, fontWeight: "bold", margin: 10 }}>
        Forwarded Messages
      </Text>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : messages.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No SMS messages yet
        </Text>
      ) : (
        <SmsList
          messages={messages}
          onToggleRead={handleToggleRead}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchMessages} />
          }
        />
      )}
    </View>
  );
}