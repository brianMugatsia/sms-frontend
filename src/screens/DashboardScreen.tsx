import React, { useEffect, useMemo, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import SmsList from "../components/SmsList";
import { listSms } from "../services/api";
import { connectWebSocket, disconnectWebSocket } from "../services/websocket";

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Read" | "Unread">("All");
  const [deviceFilter, setDeviceFilter] = useState("All");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("ForwardingRules")}
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: "white", fontSize: 24 }}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchMessages = async () => {
    try {
      const smsList = (await listSms()) ?? [];
      setMessages(
        smsList.map((sms: any) => ({
          ...sms,
          read: sms.read ?? false,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    connectWebSocket((sms: any) => {
      // Flattened payload from backend
      const newMessage = {
        ...sms,
        id: sms.responseId || Date.now().toString(), // fallback ID
        read: false,
      };

      setMessages((prev) => [newMessage, ...prev]);
    });

    return () => disconnectWebSocket();
  }, []);

  const handleToggleRead = (id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, read: !m.read }
          : m
      )
    );
  };

  const devices = useMemo(() => {
    const unique = Array.from(new Set(messages.map((m) => m.device_id)));
    return ["All", ...unique];
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const searchMatch =
        m.sender?.toLowerCase().includes(search.toLowerCase()) ||
        m.message?.toLowerCase().includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "All"
          ? true
          : statusFilter === "Read"
          ? m.read
          : !m.read;

      const deviceMatch =
        deviceFilter === "All" ? true : m.device_id === deviceFilter;

      return searchMatch && statusMatch && deviceMatch;
    });
  }, [messages, search, statusFilter, deviceFilter]);

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 25 }}>
        <Image source={require("../../assets/icon.png")} style={styles.logo} />

        <Text style={styles.title}>SMS Dashboard</Text>
        <Text style={styles.subtitle}>Monitor and manage forwarded SMS in real time</Text>

        <TextInput
          placeholder="🔍 Search sender or message..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        <View style={styles.statsRow}>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{messages.length}</Text>
            <Text style={styles.cardLabel}>Total</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{unreadCount}</Text>
            <Text style={styles.cardLabel}>Unread</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{devices.length - 1}</Text>
            <Text style={styles.cardLabel}>Devices</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Message Status</Text>
        <View style={styles.filterRow}>
          {["All", "Unread", "Read"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterButton, statusFilter === item && styles.filterButtonActive]}
              onPress={() => setStatusFilter(item as "All" | "Read" | "Unread")}
            >
              <Text style={{ color: statusFilter === item ? "#fff" : "#333", fontWeight: "600" }}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Devices</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
          {devices.map((device) => (
            <TouchableOpacity
              key={device}
              style={[styles.deviceChip, deviceFilter === device && styles.deviceChipActive]}
              onPress={() => setDeviceFilter(device)}
            >
              <Text style={{ color: deviceFilter === device ? "#fff" : "#333", fontWeight: "600" }}>
                {device}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 60 }} />
        ) : filteredMessages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 70 }}>📭</Text>
            <Text style={styles.emptyTitle}>No Messages Found</Text>
            <Text style={styles.emptySubtitle}>
              Incoming SMS matching your filters will appear here.
            </Text>
          </View>
        ) : (
          <SmsList
            messages={filteredMessages}
            onToggleRead={handleToggleRead}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchMessages();
                }}
              />
            }
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6fb" },
  logo: { width: 90, height: 90, alignSelf: "center", marginTop: 20 },
  title: { textAlign: "center", fontSize: 28, fontWeight: "700", marginTop: 10, color: "#111" },
  subtitle: { textAlign: "center", color: "#666", marginBottom: 20, marginHorizontal: 20 },
  search: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 15,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-evenly", marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: "#fff", width: 100, borderRadius: 14, paddingVertical: 18, alignItems: "center", elevation: 3 },
  cardValue: { fontSize: 24, fontWeight: "bold", color: "#007AFF" },
  cardLabel: { color: "#666", marginTop: 6, fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginHorizontal: 15, marginTop: 20, marginBottom: 10, color: "#222" },
  filterRow: { flexDirection: "row", justifyContent: "space-evenly", marginBottom: 10 },
  filterButton: { backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, elevation: 2 },
  filterButtonActive: { backgroundColor: "#007AFF" },
  deviceChip: { backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, marginRight: 10, elevation: 2 },
  deviceChipActive: { backgroundColor: "#007AFF" },
  empty: { alignItems: "center", marginTop: 70 },
  emptyTitle: { fontSize: 22, fontWeight: "bold", marginTop: 12 },
  emptySubtitle: { marginTop: 8, color: "#666", textAlign: "center", paddingHorizontal: 30 },
});
