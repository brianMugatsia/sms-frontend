import React from "react";
import {
  FlatList,
  View,
  Text,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SmsItem from "./SmsItem";
import { Sms } from "../types/sms";

interface Props {
  messages: Sms[];
  onToggleRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  refreshControl?: React.ReactElement<typeof RefreshControl>;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export default function SmsList({
  messages,
  onToggleRead,
  onDelete,
  refreshControl,
  ListHeaderComponent,
  ListEmptyComponent,
}: Props) {
  const safeMessages = [...messages].sort((a, b) => {
    const aTime = a.timestamp
      ? new Date(a.timestamp).getTime()
      : 0;

    const bTime = b.timestamp
      ? new Date(b.timestamp).getTime()
      : 0;

    return bTime - aTime;
  });

  const defaultEmpty = (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 50,
      }}
    >
      <Text style={{ fontSize: 70 }}>
        📭
      </Text>

      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          marginTop: 10,
        }}
      >
        No Messages
      </Text>

      <Text
        style={{
          color: "#666",
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Incoming SMS messages will appear here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
      edges={["left", "right"]}
    >
      <FlatList
        data={safeMessages}
        keyExtractor={(item) => item.id}
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingHorizontal: 10,
          flexGrow: 1,
        }}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent ?? defaultEmpty}
        ItemSeparatorComponent={() => (
          <View style={{ height: 10 }} />
        )}
        renderItem={({ item }) => (
          <SmsItem
            sms={item}
            onToggleRead={onToggleRead}
            onDelete={onDelete}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}