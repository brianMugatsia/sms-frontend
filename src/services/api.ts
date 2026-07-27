import axios, { AxiosInstance } from "axios";
import { getDeviceId } from "./deviceService";

// ======================================================
// BACKEND
// ======================================================

const BASE_URL = "https://sms-backend-w6d5.onrender.com/api";

// ======================================================
// AXIOS
// ======================================================

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// ======================================================
// REQUEST LOGGER
// ======================================================

api.interceptors.request.use(
  (config) => {
    console.log(`${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// SETTINGS (Updated to match Single-Instance backend fields)
// ======================================================

export interface Settings {
  storage_endpoint: string;
  storage_api_key: string;
  dashboard_endpoint: string;
  dashboard_api_key: string;
  is_archived: boolean;
}

export interface EndpointTestRequest {
  storage_endpoint: string;
  storage_api_key?: string;
}

export interface EndpointTestResponse {
  success: boolean;
  message: string;
  status_code?: number | null;
}

/**
 * Load current flat system settings
 */
export const getSettings = async () => {
  const response = await api.get("/settings");
  return response.data as Settings;
};

/**
 * Save unified system settings
 */
export const saveSettings = async (settings: Settings) => {
  const response = await api.put("/settings", settings);
  return response.data as Settings;
};

/**
 * Test storage endpoint connection
 */
export const testConnection = async (
  data: EndpointTestRequest
): Promise<EndpointTestResponse> => {
  const response = await api.post("/settings/test", data);
  return response.data;
};

// ======================================================
// SMS (Flattened and Cleaned)
// ======================================================

export interface SmsPayload {
  id?: string;
  sender: string;
  message: string;
  received_at?: number;
  device_id?: string;
}

export const forwardSms = async (sms: SmsPayload) => {
  const device_id = sms.device_id ?? (await getDeviceId());
  const payload = { ...sms, device_id };
  console.log("Forwarding SMS:", payload);
  const response = await api.post("/sms/forward", payload);
  return response.data;
};

/**
 * Now scoped to this device only - device_id is required by the
 * backend so each dashboard only ever sees its own messages.
 */
export const listSms = async () => {
  const device_id = await getDeviceId();
  const response = await api.get("/sms/", { params: { device_id } });
  return response.data;
};

export const getSms = async (id: string) => {
  const device_id = await getDeviceId();
  const response = await api.get(`/sms/${id}`, { params: { device_id } });
  return response.data;
};

export const deleteSms = async (id: string) => {
  const device_id = await getDeviceId();
  const response = await api.delete(`/sms/${id}`, { params: { device_id } });
  return response.data;
};

export const clearSms = async () => {
  const device_id = await getDeviceId();
  const response = await api.delete("/sms", { params: { device_id } });
  return response.data;
};

// ======================================================
// HEALTH
// ======================================================

export const pingServer = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;