import { getDeviceId } from "./deviceService";

let ws: WebSocket | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
const MAX_RETRIES = 10;

export const connectWebSocket = async (
  onMessage: (data: any) => void
) => {

  if (
    ws &&
    (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    )
  ) {
    console.log("WS already connected");
    return;
  }

  const deviceId = await getDeviceId();

  if (!deviceId || deviceId === "unknown-device") {
    console.log("WS connect skipped: no valid device_id yet");
    // Retry shortly rather than opening a doomed connection
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectWebSocket(onMessage);
      }, 2000);
    }
    return;
  }

  ws = new WebSocket(
    `wss://sms-backend-w6d5.onrender.com/ws/sms?device_id=${encodeURIComponent(deviceId)}`
  );

  ws.onopen = () => {

    console.log("WS connected");

    retryCount = 0;

    if (heartbeat) {
      clearInterval(heartbeat);
    }

    heartbeat = setInterval(() => {

      if (ws?.readyState === WebSocket.OPEN) {

        ws.send(
          JSON.stringify({
            type: "ping",
          })
        );

      }

    }, 30000);

  };

  ws.onmessage = (event) => {

    try {

      const message = JSON.parse(event.data);

      if (message.type === "pong") {
        return;
      }

      onMessage(message);

    } catch (e) {

      console.log("WS parse error", e);

    }

  };

  ws.onerror = (e) => {

    console.log("WS error", e);

  };

  ws.onclose = (event) => {

    console.log(
      `WS closed ${event.code}`
    );

    if (heartbeat) {

      clearInterval(heartbeat);

      heartbeat = null;

    }

    ws = null;

    if (
      retryCount < MAX_RETRIES &&
      !reconnectTimeout
    ) {

      retryCount++;

      reconnectTimeout = setTimeout(() => {

        reconnectTimeout = null;

        connectWebSocket(onMessage);

      }, retryCount * 5000);

    }

  };

};

export const disconnectWebSocket = () => {

  if (heartbeat) {

    clearInterval(heartbeat);

    heartbeat = null;

  }

  if (reconnectTimeout) {

    clearTimeout(reconnectTimeout);

    reconnectTimeout = null;

  }

  if (ws) {

    ws.close();

    ws = null;

  }

};