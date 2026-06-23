import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import SmsList from "./components/SmsList";
import { login, listSms } from "./services/api";
import { connectWebSocket, disconnectWebSocket } from "./services/websocket";

interface Sms {
  id: string;
  sender: string;
  message: string;
  device_id: string;
  forwarded_by?: string;
  role?: string;
  read?: boolean;
}

export default function App() {
  const [messages, setMessages] = useState<Sms[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        // authenticate first
        await login("alice", "password123");

        // fetch existing SMS list safely
        let rawList: Sms[] | undefined;
        try {
          rawList = await listSms();
        } catch (err) {
          console.error("Failed to fetch SMS list:", err);
          rawList = [];
        }

        const smsList = (rawList ?? []).map((sms) => ({
          ...sms,
          read: sms.read ?? false,
        }));
        setMessages(smsList);

        // connect WebSocket and parse JSON payloads safely
        connectWebSocket((eventData: any) => {
          try {
            const sms: Sms = JSON.parse(eventData);
            if (!sms || !sms.id) {
              console.warn("Skipping invalid WebSocket payload:", eventData);
              return;
            }
            setMessages((prev) => [
              { ...sms, read: sms.read ?? false },
              ...prev,
            ]);
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        });
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    init();
    return () => disconnectWebSocket();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SmsList messages={messages} />
    </SafeAreaView>
  );
}
