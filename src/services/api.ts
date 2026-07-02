import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ======================================
// AXIOS INSTANCE
// ======================================
export const api = axios.create({
  baseURL: "https://sms-backend-w6d5.onrender.com/api", // correct for emulator/physical device
  timeout: 60000, // allow longer timeout for Render spin-up
});

// ======================================
// TOKEN HELPERS
// ======================================
export const setToken = async (token: string) => {
  await AsyncStorage.setItem("token", token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem("token");
};

export const removeToken = async () => {
  await AsyncStorage.removeItem("token");
};

// ======================================
// REQUEST INTERCEPTOR
// ======================================
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================
// AUTH
// ======================================
export const login = async (username: string, password: string) => {
  try {
    // FastAPI OAuth2PasswordRequestForm expects form-encoded data
    const payload = new URLSearchParams({ username, password });

    console.log("Login payload:", payload.toString());

    const res = await api.post("/users/login", payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      responseType: "json",
    });

    await setToken(res.data.access_token);
    return res.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Response error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("Request error:", error.request);
    } else {
      console.error("Axios error:", error.message);
    }
    throw error;
  }
};

// ======================================
// REFRESH TOKEN
// ======================================
export const refreshToken = async () => {
  try {
    const res = await api.post("/users/refresh");
    await setToken(res.data.access_token);
    return res.data.access_token;
  } catch (err) {
    console.error("Token refresh failed:", err);
    await removeToken();
    throw err;
  }
};

// ======================================
// RESPONSE INTERCEPTOR (auto-refresh)
// ======================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh failed, logging out");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ======================================
// SMS
// ======================================
export const listSms = async () => {
  const res = await api.get("/sms/list");
  return res.data;
};

export const forwardSms = async (sms: {
  sender: string;
  message: string;
  device_id: string;
}) => {
  const res = await api.post("/sms/forward", sms);
  return res.data;
};
