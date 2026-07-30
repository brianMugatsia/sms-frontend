import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from "react-native";

const { SettingsBridge } = NativeModules;

const BOOTSTRAP_URL =
  "https://raw.githubusercontent.com/brianMugatsia/sms-frontend/refs/heads/main/config/app-config.json";

const FALLBACK_BASE_URL = "https://smsapi.roberms.com";

const CACHE_KEY = "app_config_cache";

// Holds the last resolved base URL in memory so other files (api.ts,
// websocket.ts) can read it instantly via getApiBaseUrl() without
// re-fetching or awaiting anything.
let resolvedBaseUrl: string = FALLBACK_BASE_URL;

export const fetchAndSyncAppConfig = async (): Promise<string> => {
  let baseUrl = FALLBACK_BASE_URL;

  try {
    const response = await fetch(BOOTSTRAP_URL, { cache: "no-store" as any });
    const json = await response.json();

    if (json?.api_base_url && typeof json.api_base_url === "string") {
      baseUrl = json.api_base_url;
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json));
      console.log("[CONFIG] Fetched fresh config:", baseUrl);
    } else {
      throw new Error("Malformed config response");
    }
  } catch (e) {
    console.log("[CONFIG] Bootstrap fetch failed, trying cache:", e);

    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.api_base_url) {
          baseUrl = parsed.api_base_url;
          console.log("[CONFIG] Using cached config:", baseUrl);
        }
      } else {
        console.log("[CONFIG] No cache available, using hardcoded fallback:", baseUrl);
      }
    } catch (cacheErr) {
      console.log("[CONFIG] Cache read failed too, using hardcoded fallback:", baseUrl);
    }
  }

  resolvedBaseUrl = baseUrl;

  try {
    if (SettingsBridge?.setApiBaseUrl) {
      await SettingsBridge.setApiBaseUrl(baseUrl);
      console.log("[CONFIG] Synced api_base_url to native:", baseUrl);
    } else {
      console.warn("[CONFIG] SettingsBridge.setApiBaseUrl not available");
    }
  } catch (e) {
    console.log("[CONFIG] Failed to sync to native:", e);
  }

  return baseUrl;
};

/**
 * Returns the currently resolved base URL synchronously (no network call).
 * Always call fetchAndSyncAppConfig() once at app startup before relying
 * on this — App.tsx already does this early in its init sequence.
 */
export const getApiBaseUrl = (): string => resolvedBaseUrl;