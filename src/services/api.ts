import axios, { AxiosInstance } from "axios";

// ======================================================
// BACKEND
// ======================================================

const BASE_URL =
  "https://sms-backend-w6d5.onrender.com/api";

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
    console.log(
      `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
    );

    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// SETTINGS
// ======================================================

export interface Settings {
  storage_endpoint: string;
  storage_api_key: string;
}

export const getSettings = async () => {
  const response = await api.get("/settings");
  return response.data;
};

export const saveSettings = async (
  settings: Settings
) => {
  const response = await api.put(
    "/settings",
    settings
  );

  return response.data;
};

// ======================================================
// SMS
// ======================================================

export const forwardSms = async (sms: {
  id?: string;
  sender: string;
  message: string;
  device_id: string;
  received_at?: number;
}) => {
  console.log("Forwarding SMS:", sms);

  const response = await api.post(
    "/sms/forward",
    sms
  );

  return response.data;
};

export const listSms = async () => {
  const response = await api.get("/sms/list");
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

// ======================================================
// EXPORT
// ======================================================

export default api;