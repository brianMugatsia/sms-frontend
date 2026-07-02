import { getToken, refreshToken } from "./api";

let ws: WebSocket | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

export const connectWebSocket = async (
  onMessage: (data: any) => void
) => {
  try {
    let token = await getToken();

    // If no token, try to refresh
    if (!token) {
      try {
        token = await refreshToken();
      } catch (err) {
        console.error("Unable to get token for WS:", err);
        return;
      }
    }

    const url = `wss://sms-backend-w6d5.onrender.com/ws/sms?token=${token}`;

    // Prevent duplicate connections
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      console.log("WS already connected");
      return;
    }

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WS connected");

      // Start heartbeat ping every 30s
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = setInterval(() => sendPing(), 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "pong") return;

        if (typeof onMessage === "function") {
          onMessage(data);
        } else {
          console.log("onMessage is not a function");
        }
      } catch (e) {
        console.log("WS parse error", e);
      }
    };

    ws.onerror = (e) => {
      console.log("WS error", e);
    };

    ws.onclose = async () => {
      console.log("WS closed");

      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }

      ws = null;

      // Auto-reconnect after 5s with refreshed token
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(async () => {
          reconnectTimeout = null;
          await connectWebSocket(onMessage);
        }, 5000);
      }
    };
  } catch (err) {
    console.error("WS connection failed:", err);
  }
};

export const sendPing = () => {
  if (ws?.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({ type: "ping" }));
    } catch (err) {
      console.error("Ping failed:", err);
    }
  }
};

export const disconnectWebSocket = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  console.log("WS disconnected manually");
};
