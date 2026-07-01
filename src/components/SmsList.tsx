import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SmsItem from "./SmsItem";
import { Sms } from "../types/sms";

export default function SmsList({
  messages,
  onToggleRead,
  onDelete,
  refreshControl,
}: {
  messages: Sms[];
  onToggleRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  refreshControl?: React.ReactElement;
}) {
  const safeMessages = messages
    ?.filter((m) => m && m.id)
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // newest first
    });

  const renderRightActions = (id: string) => (
    <View style={{ flexDirection: "row" }}>
      <TouchableOpacity
        onPress={() => onToggleRead?.(id)}
        style={{
          backgroundColor: "#007AFF",
          justifyContent: "center",
          alignItems: "center",
          width: 80,
        }}
      >
        <Text style={{ color: "#fff" }}>Toggle</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onDelete?.(id)}
        style={{
          backgroundColor: "red",
          justifyContent: "center",
          alignItems: "center",
          width: 80,
        }}
      >
        <Text style={{ color: "#fff" }}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      <FlatList
        data={safeMessages}
        keyExtractor={(item, index) =>
          item?.id?.toString() ?? index.toString()
        }
        renderItem={({ item }) => (
          <SmsItem
            sms={item}
            onToggleRead={onToggleRead}
            onDelete={onDelete}
          />
        )}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={refreshControl}
      />
    </SafeAreaView>
  );
}