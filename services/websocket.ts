import AsyncStorage from "@react-native-async-storage/async-storage";
import { refreshToken } from "./api"; // make sure this exists

let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let heartbeat: NodeJS.Timeout | null = null;

export const connectWebSocket = async (
  onMessage: (sms: any) => void,
  onStatus?: (status: string) => void
) => {
  let token = await AsyncStorage.getItem("token");

  // try refreshing if missing
  if (!token) {
    try {
      token = await refreshToken();
    } catch {
      console.error("No valid token, cannot connect WebSocket");
      return;
    }
  }

  ws = new WebSocket(`ws://10.0.2.2:8000/ws/sms?token=${token}`);

  ws.onopen = () => {
    console.log("WebSocket connected");
    onStatus?.("connected");

    // heartbeat ping every 30s
    heartbeat = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 30000);
  };

  ws.onmessage = (event) => {
    try {
      const sms = JSON.parse(event.data);
      onMessage(sms);
    } catch (err) {
      console.error("Error parsing WebSocket message:", err, event.data);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    onStatus?.("error");
  };

  ws.onclose = (event) => {
    console.log("WebSocket closed:", event.code, event.reason);
    onStatus?.("disconnected");

    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }

    // auto‑reconnect after 5s
    reconnectTimeout = setTimeout(() => connectWebSocket(onMessage, onStatus), 5000);
  };
};

export const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
};
