import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:8000/api";

// ======================
// Token Management
// ======================

export const setToken = async (newToken: string) => {
  await AsyncStorage.setItem("token", newToken);
};

export const getToken = async () => {
  return await AsyncStorage.getItem("token");
};

const getAuthHeaders = async () => {
  const token = await getToken();
  return { Authorization: `Bearer ${token}` };
};

// ======================
// Authentication
// ======================

export const login = async (username: string, password: string) => {
  try {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    const res = await axios.post(`${API_URL}/users/login`, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    await setToken(res.data.access_token);
    // backend currently doesn’t issue refresh_token, so skip storing it
    return res.data;
  } catch (error: any) {
    console.error("Login Error:", error.response?.data || error.message);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const res = await axios.post(`${API_URL}/users/refresh`, {}, {
      headers: await getAuthHeaders(),
    });
    await setToken(res.data.access_token);
    return res.data.access_token;
  } catch (error: any) {
    console.error("Refresh Token Error:", error.response?.data || error.message);
    throw error;
  }
};

// ======================
// SMS APIs
// ======================

export const listSms = async () => {
  try {
    const res = await axios.get(`${API_URL}/sms/list`, { headers: await getAuthHeaders() });
    return res.data;
  } catch (error: any) {
    console.error("List SMS Error:", error.response?.data || error.message);
    throw error;
  }
};

export const forwardSms = async (sms: { sender: string; message: string; device_id: string }) => {
  try {
    const res = await axios.post(`${API_URL}/sms/forward`, sms, {
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error: any) {
    console.error("Forward SMS Error:", error.response?.data || error.message);
    throw error;
  }
};

// ======================
// WebSocket
// ======================

let ws: WebSocket | null = null;

export const connectWebSocket = (onMessage: (sms: any) => void) => {
  ws = new WebSocket("ws://10.0.2.2:8000/ws/sms");

  ws.onopen = () => console.log("WebSocket connected");
  ws.onmessage = (event) => {
    try {
      const sms = JSON.parse(event.data);
      onMessage(sms);
    } catch (err) {
      console.error("Error parsing WebSocket message:", err);
    }
  };
  ws.onerror = (error) => console.error("WebSocket error:", error);
  ws.onclose = () => console.log("WebSocket disconnected");
};

export const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};
