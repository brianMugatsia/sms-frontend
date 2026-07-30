import { getDeviceId } from "./deviceService";
import { getApiBaseUrl } from "./configService";

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
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectWebSocket(onMessage);
      }, 2000);
    }
    return;
  }

  // Derive wss:// from whatever the resolved base URL's scheme is (http -> ws, https -> wss)
  const baseUrl = getApiBaseUrl();
  const wsScheme = baseUrl.startsWith("https") ? "wss" : "ws";
  const host = baseUrl.replace(/^https?:\/\//, "");

  ws = new WebSocket(
    `${wsScheme}://${host}/ws/sms?device_id=${encodeURIComponent(deviceId)}`
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

      const parsed = JSON.parse(event.data);

      if (parsed.type === "pong") {
        return;
      }

      const payload = parsed.data ?? parsed;

      if (!payload || payload.id == null) {
        console.log("[WS] Ignoring message with no id:", parsed);
        return;
      }

      onMessage(payload);

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