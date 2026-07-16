import React, {
  useEffect,
  useMemo,
  useLayoutEffect,
  useState,
  useCallback,
} from "react";

import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
  FlatList,
  Platform,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";

import { deleteSms, clearSms } from "../services/api";
import { refreshSmsDashboard } from "../services/syncService";
import {
  getDashboardSMS,
  deleteCachedSms,
  clearCachedSms
} from "../services/smsCacheService";
import { connectWebSocket, disconnectWebSocket } from "../services/websocket";
import { getContactName } from "../services/contactService";
import { openBatterySettings } from "../services/batteryOptimization";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface SmsItem {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  device_id: string;
  status: "pending" | "success" | "failed";
}

const COLORS = {
  primary: "#4338CA",
  primaryDark: "#3730A3",
  primarySoft: "#EEF2FF",
  background: "#F4F5F9",
  card: "#FFFFFF",
  text: "#111827",
  subtext: "#6B7280",
  faint: "#9CA3AF",
  border: "#E5E7EB",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  successSoft: "#ECFDF5",
  warningSoft: "#FFFBEB",
  dangerSoft: "#FEF2F2",
  overlay: "rgba(17, 24, 39, 0.45)",
  segmentTrack: "#EAEBF2",
};

const STATUS_OPTIONS = ["All", "Pending", "Success", "Failed"] as const;

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<SmsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("All");
  const [deviceFilter, setDeviceFilter] = useState("All");
  const [menuVisible, setMenuVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: COLORS.primary },
      headerTitleStyle: { color: "#fff", fontWeight: "700" },
      headerTintColor: "#fff",
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setMenuVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadMessages = async () => {
    try {
      setRefreshing(true);
      const cached = await getDashboardSMS();
      if (cached && cached.length > 0) {
        setMessages(
          cached.map((c) => ({
            id: c.id,
            sender: c.sender,
            message: c.message,
            timestamp: c.timestamp,
            device_id: c.device_id,
            status: c.status as SmsItem["status"],
          }))
        );
      }

      const refreshedData = await refreshSmsDashboard();

      const rawItems = refreshedData && typeof refreshedData === 'object' && 'items' in refreshedData
        ? refreshedData.items
        : refreshedData;

      if (Array.isArray(rawItems)) {
        setMessages(
          rawItems.map((c) => ({
            id: c.id,
            sender: c.sender,
            message: c.message,
            timestamp: c.timestamp,
            device_id: c.device_id,
            status: c.status as SmsItem["status"],
          }))
        );
      } else {
        console.warn("[SYNC] Unexpected structure returned by refresh dashboard sync:", refreshedData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
    connectWebSocket((sms: SmsItem) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === sms.id);
        if (exists) {
          return prev.map((m) => (m.id === sms.id ? sms : m));
        }
        return [sms, ...prev];
      });
    });
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Delete Message", "Remove this message from the dashboard?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSms(id);
            await deleteCachedSms(id);
            setMessages((prev) => prev.filter((m) => m.id !== id));
          } catch (error: any) {
            console.error("[DELETE ERROR]", error);
            if (error?.response?.status === 404) {
              await deleteCachedSms(id);
              setMessages((prev) => prev.filter((m) => m.id !== id));
              Alert.alert("Notice", "This message was already removed from the server.");
            } else {
              Alert.alert(
                "Delete Failed",
                "Could not delete message. Please check your connection and try again."
              );
            }
          }
        },
      },
    ]);
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert("Clear Dashboard", "Remove all SMS from the dashboard?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await clearSms();
            await clearCachedSms();
            setMessages([]);
          } catch (error) {
            console.error("[CLEAR ALL ERROR]", error);
            Alert.alert("Error", "Could not clear messages. Try again later.");
          }
        },
      },
    ]);
  }, []);

  const devices = useMemo(() => {
    const unique = Array.from(
      new Set(messages.map((m) => m.device_id).filter(Boolean))
    );
    return ["All", ...unique];
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const contactName = getContactName(m.sender) ?? "";
      const searchMatch =
        m.sender.toLowerCase().includes(search.toLowerCase()) ||
        m.message.toLowerCase().includes(search.toLowerCase()) ||
        contactName.toLowerCase().includes(search.toLowerCase());
      const deviceMatch =
        deviceFilter === "All" ? true : m.device_id === deviceFilter;
      const statusMatch =
        statusFilter === "All" ? true : m.status === statusFilter.toLowerCase();
      return searchMatch && deviceMatch && statusMatch;
    });
  }, [messages, search, deviceFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      pending: messages.filter((m) => m.status === "pending").length,
      success: messages.filter((m) => m.status === "success").length,
      failed: messages.filter((m) => m.status === "failed").length,
    };
  }, [messages]);

  const hasFilters =
    search.length > 0 || statusFilter !== "All" || deviceFilter !== "All";

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("All");
    setDeviceFilter("All");
  }, []);

  const statusMeta = (status: SmsItem["status"]) => {
    switch (status) {
      case "success":
        return { bg: styles.success, dot: COLORS.success, label: "Success" };
      case "failed":
        return { bg: styles.failed, dot: COLORS.danger, label: "Failed" };
      default:
        return { bg: styles.pending, dot: COLORS.warning, label: "Pending" };
    }
  };

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.emptyStateSubtitle}>Loading messages…</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Icon name="inbox" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyStateTitle}>No SMS Found</Text>
        <Text style={styles.emptyStateSubtitle}>
          {hasFilters
            ? "No messages match your current filters."
            : "SMS forwarded through the backend will appear here."}
        </Text>
        {hasFilters && (
          <TouchableOpacity style={styles.emptyClearBtn} onPress={clearAllFilters}>
            <Text style={styles.emptyClearBtnText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [loading, hasFilters, clearAllFilters]);

  const renderHeader = useCallback(() => (
    <View>
      {/* Stats — KPI strip */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderTopColor: COLORS.primary }]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: COLORS.primarySoft }]}>
            <Icon name="forum" size={15} color={COLORS.primary} />
          </View>
          <Text style={styles.kpiValue}>{messages.length}</Text>
          <Text style={styles.kpiLabel}>Total</Text>
        </View>

        <View style={[styles.kpiCard, { borderTopColor: COLORS.warning }]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: COLORS.warningSoft }]}>
            <Icon name="schedule" size={15} color={COLORS.warning} />
          </View>
          <Text style={[styles.kpiValue, { color: COLORS.warning }]}>
            {stats.pending}
          </Text>
          <Text style={styles.kpiLabel}>Pending</Text>
        </View>

        <View style={[styles.kpiCard, { borderTopColor: COLORS.success }]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: COLORS.successSoft }]}>
            <Icon name="check-circle" size={15} color={COLORS.success} />
          </View>
          <Text style={[styles.kpiValue, { color: COLORS.success }]}>
            {stats.success}
          </Text>
          <Text style={styles.kpiLabel}>Success</Text>
        </View>

        <View style={[styles.kpiCard, { borderTopColor: COLORS.danger }]}>
          <View style={[styles.kpiIconWrap, { backgroundColor: COLORS.dangerSoft }]}>
            <Icon name="error-outline" size={15} color={COLORS.danger} />
          </View>
          <Text style={[styles.kpiValue, { color: COLORS.danger }]}>
            {stats.failed}
          </Text>
          <Text style={styles.kpiLabel}>Failed</Text>
        </View>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchWrap,
          (searchFocused || search.length > 0) && styles.searchWrapActive,
        ]}
      >
        <View
          style={[
            styles.searchIconBadge,
            (searchFocused || search.length > 0) && styles.searchIconBadgeActive,
          ]}
        >
          <Icon
            name="search"
            size={16}
            color={(searchFocused || search.length > 0) ? "#fff" : COLORS.subtext}
          />
        </View>

        <TextInput
          style={styles.search}
          placeholder="Search sender, contact, or message"
          placeholderTextColor={COLORS.faint}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            hitSlop={10}
            style={styles.searchClearBtn}
            activeOpacity={0.7}
          >
            <Icon name="close" size={13} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter — segmented control */}
      <View style={styles.segmentTrack}>
        {STATUS_OPTIONS.map((option) => {
          const active = statusFilter === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => setStatusFilter(option)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {hasFilters && (
        <TouchableOpacity style={styles.clearFiltersBtnStandalone} onPress={clearAllFilters}>
          <Icon name="filter-alt-off" size={14} color={COLORS.subtext} />
          <Text style={styles.clearFiltersText}>Reset filters</Text>
        </TouchableOpacity>
      )}

      {/* Device filter */}
      {devices.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.deviceFilterScroll}
          contentContainerStyle={styles.deviceFilterContent}
        >
          {devices.map((device) => {
            const active = deviceFilter === device;
            return (
              <TouchableOpacity
                key={device}
                style={[styles.deviceChip, active && styles.deviceChipActive]}
                onPress={() => setDeviceFilter(device)}
              >
                <Icon
                  name="smartphone"
                  size={14}
                  color={active ? COLORS.primary : COLORS.subtext}
                />
                <Text
                  style={[
                    styles.deviceChipText,
                    active && styles.deviceChipTextActive,
                  ]}
                >
                  {device}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>
          Messages{" "}
          <Text style={styles.listHeaderCount}>({filteredMessages.length})</Text>
        </Text>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} hitSlop={8}>
            <Text style={styles.clearAllInlineText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [messages, stats, search, searchFocused, statusFilter, hasFilters, clearAllFilters, devices, deviceFilter, filteredMessages.length, handleClearAll]);

  const renderItem = useCallback(({ item }: { item: SmsItem }) => {
    const meta = statusMeta(item.status);
    const contactName = getContactName(item.sender);
    const displayName = contactName || item.sender;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.senderRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
            <View>
              <Text style={styles.sender}>{displayName}</Text>
              {contactName && (
                <Text style={styles.deviceTag}>{item.sender}</Text>
              )}
              <Text style={styles.deviceTag}>{item.device_id}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, meta.bg]}>
            <View style={[styles.statusDot, { backgroundColor: meta.dot }]} />
            <Text style={[styles.statusText, { color: meta.dot }]}>
              {meta.label}
            </Text>
          </View>
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.time}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            hitSlop={8}
          >
            <Icon name="delete-outline" size={16} color={COLORS.danger} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleDelete]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadMessages}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />

      {/* Bottom sheet modal */}
      <Modal
        visible={menuVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Options</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("ForwardingRules");
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: COLORS.primarySoft }]}>
                <Icon name="rule" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuText}>Forwarding Rules</Text>
                <Text style={styles.menuSubText}>
                  Manage where messages are routed
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color={COLORS.faint} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Settings");
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: COLORS.primarySoft }]}>
                <Icon name="settings" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuText}>Settings</Text>
                <Text style={styles.menuSubText}>App preferences and account</Text>
              </View>
              <Icon name="chevron-right" size={22} color={COLORS.faint} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                openBatterySettings();
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: COLORS.primarySoft }]}>
                <Icon name="battery-charging-full" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuText}>Battery Settings</Text>
                <Text style={styles.menuSubText}>
                  Disable battery optimization for reliable background SMS forwarding
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color={COLORS.faint} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleClearAll();
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: COLORS.dangerSoft }]}>
                <Icon name="delete-sweep" size={20} color={COLORS.danger} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuText, { color: COLORS.danger }]}>
                  Clear All Messages
                </Text>
                <Text style={styles.menuSubText}>
                  Permanently remove all SMS from dashboard
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color={COLORS.faint} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.sheetCloseText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerButton: { marginRight: 16, padding: 4 },
  listContent: { paddingBottom: 32 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: 54,
    ...Platform.select({
      ios: {
        shadowColor: "#111827",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 1.5 },
    }),
  },
  searchWrapActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#FAFAFF",
    ...Platform.select({
      ios: {
        shadowOpacity: 0.09,
        shadowColor: COLORS.primary,
      },
      android: { elevation: 3 },
    }),
  },
  searchIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  searchIconBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  search: {
    flex: 1,
    fontSize: 14.5,
    color: COLORS.text,
    fontWeight: "500",
    paddingVertical: 0,
  },
  searchClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  kpiRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 18,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "flex-start",
    ...Platform.select({
      ios: {
        shadowColor: "#111827",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  kpiIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  kpiLabel: {
    marginTop: 3,
    color: COLORS.subtext,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  segmentTrack: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.segmentTrack,
    borderRadius: 12,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  segmentItemActive: {
    backgroundColor: COLORS.card,
    ...Platform.select({
      ios: {
        shadowColor: "#111827",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 2 },
    }),
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: COLORS.subtext,
  },
  segmentTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  clearFiltersBtnStandalone: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginHorizontal: 16,
    marginTop: 8,
  },
  clearFiltersText: { marginLeft: 4, color: COLORS.subtext, fontWeight: "600", fontSize: 13 },

  deviceFilterScroll: { marginTop: 14 },
  deviceFilterContent: { paddingHorizontal: 16, paddingBottom: 4 },
  deviceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deviceChipActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  deviceChipText: { marginLeft: 6, color: COLORS.subtext, fontWeight: "600", fontSize: 13 },
  deviceChipTextActive: { color: COLORS.primary },

  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  listHeaderTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  listHeaderCount: { color: COLORS.subtext, fontWeight: "500" },
  clearAllInlineText: { color: COLORS.danger, fontWeight: "600", fontSize: 13 },

  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyStateTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text, marginTop: 4 },
  emptyStateSubtitle: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyClearBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
  },
  emptyClearBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },

  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#111827",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 2 },
    }),
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  senderRow: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sender: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  deviceTag: { fontSize: 11, color: COLORS.faint, marginTop: 1 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  success: { backgroundColor: COLORS.successSoft },
  failed: { backgroundColor: COLORS.dangerSoft },
  pending: { backgroundColor: COLORS.warningSoft },
  statusText: { fontSize: 11, fontWeight: "700" },
  message: { marginTop: 12, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  cardFooter: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  time: { fontSize: 11, color: COLORS.faint },
  deleteButton: { flexDirection: "row", alignItems: "center" },
  deleteText: { color: COLORS.danger, fontWeight: "600", fontSize: 12, marginLeft: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    width: "100%",
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.faint,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuTextWrap: { flex: 1 },
  menuText: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  menuSubText: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
  sheetCloseBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  sheetCloseText: { fontSize: 15, fontWeight: "700", color: COLORS.text },
});