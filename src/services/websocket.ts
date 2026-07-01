// services/websocket.ts

import { getToken } from "./api";

let ws: WebSocket | null = null;

export const connectWebSocket = async (
  onMessage: (data: any) => void
) => {
  const token = await getToken();

  const url = `wss://sms-backend-w6d5.onrender.com/ws/sms?token=${token}`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("WS connected");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "pong") return;

      onMessage(data);
    } catch (e) {
      console.log("WS parse error", e);
    }
  };

  ws.onerror = (e) => console.log("WS error", e);

  ws.onclose = () => console.log("WS closed");
};

export const sendPing = () => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "ping" }));
  }
};

export const disconnectWebSocket = () => {
  ws?.close();
  ws = null;
};