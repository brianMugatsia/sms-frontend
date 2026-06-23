import React from "react";
import { FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SmsItem from "./SmsItem";

interface Sms {
  id: string;
  sender: string;
  message: string;
  device_id: string;
  forwarded_by?: string;
  role?: string;
  read?: boolean;
}

export default function SmsList({ messages, onToggleRead }: { messages: Sms[]; onToggleRead?: (id: string) => void }) {
  const safeMessages = messages?.filter((m) => m && m.id);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={safeMessages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onToggleRead?.(item.id)}>
            <SmsItem sms={item} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
