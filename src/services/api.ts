import axios, { AxiosInstance } from "axios";

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
}

export const forwardSms = async (sms: SmsPayload) => {
  console.log("Forwarding SMS:", sms);
  const response = await api.post("/sms/forward", sms);
  return response.data;
};

/**
 * UPDATED: Pointing to the flat root endpoint matching your single cache
 */
export const listSms = async () => {
  const response = await api.get("/sms/");
  return response.data;
};

export const getSms = async (id: string) => {
  const response = await api.get(`/sms/${id}`);
  return response.data;
};

export const deleteSms = async (id: string) => {
  const response = await api.delete(`/sms/${id}`);
  return response.data;
};

export const clearSms = async () => {
  const response = await api.delete("/sms/clear");
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