import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import SmsList from "../components/SmsList";
import { listSms } from "../services/api";
import { connectWebSocket, disconnectWebSocket } from "../services/websocket";
import SmsForwarder from "../SmsForwarder";

interface Sms {
  id: string;
  sender: string;
  message: string;
  device_id: string;
  forwarded_by?: string;
  role?: string;
  read?: boolean;
}

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
      <Text style={{ fontSize: 20, fontWeight: "bold", margin: 10 }}>
        Forwarded Messages
      </Text>
      <SmsForwarder />
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMessages(); }} />
          }
        >
          <SmsList messages={messages} onToggleRead={handleToggleRead} />
        </ScrollView>
      )}
    </View>
  );
}
