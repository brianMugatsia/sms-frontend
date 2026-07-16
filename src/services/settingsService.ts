import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules } from "react-native";
import { ForwardingSettings } from "../types/settings";

const { SettingsBridge } = NativeModules;
const SETTINGS_KEY = "forwarding_settings";

export const defaultSettings: ForwardingSettings = {
  // SMS Forwarding
  enabled: true,
  forwardAll: true,

  // Allowed senders
  keywords: [],

  // User storage endpoint
  storage_endpoint: "",

  // Optional API key
  storage_api_key: "",
};

/**
 * Push current forwarding rules (enabled, forwardAll, keywords) into native
 * SharedPreferences so SmsReceiver.kt can read them even when JS isn't running.
 */
async function syncToNative(settings: ForwardingSettings): Promise<void> {
  try {
    if (!SettingsBridge) {
      console.warn("SettingsBridge native module not found — did you rebuild the app?");
      return;
    }
    await SettingsBridge.syncSettings(
      settings.enabled,
      settings.forwardAll,
      settings.keywords
    );
  } catch (error) {
    console.error("Failed syncing settings to native:", error);
  }
}

/**
 * Load settings
 */
export async function loadSettings(): Promise<ForwardingSettings> {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!value) {
      // Seed native prefs even on first-ever load, so SmsReceiver has correct
      // defaults before the user ever opens the settings screen.
      await syncToNative(defaultSettings);
      return defaultSettings;
    }

    const parsed = JSON.parse(value);

    // Backward compatibility helper: if someone updated via legacy camelCase keys,
    // map them cleanly over to snake_case.
    const merged: ForwardingSettings = {
      ...defaultSettings,
      ...parsed,
      storage_endpoint: parsed.storage_endpoint ?? parsed.storageEndpoint ?? defaultSettings.storage_endpoint,
      storage_api_key: parsed.storage_api_key ?? parsed.storageApiKey ?? defaultSettings.storage_api_key,
    };

    // Keep native prefs in sync on every load too (covers app updates, reinstall edge cases)
    await syncToNative(merged);

    return merged;
  } catch (error) {
    console.error("Failed loading settings:", error);
    return defaultSettings;
  }
}

/**
 * Save settings
 */
export async function saveSettings(
  settings: ForwardingSettings
): Promise<void> {
  try {
    // Normalizes back into explicit snake_case layout to match api.ts
    const normalizedSettings = {
      ...settings,
      storage_endpoint: settings.storage_endpoint ?? (settings as any).storageEndpoint,
      storage_api_key: settings.storage_api_key ?? (settings as any).storageApiKey,
    };

    // Strip legacy camelCase keys if present to prevent AsyncStorage bloat
    delete (normalizedSettings as any).storageEndpoint;
    delete (normalizedSettings as any).storageApiKey;

    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(normalizedSettings)
    );

    // Mirror into native SharedPreferences so SmsReceiver sees the update
    // even when the JS/React Native runtime isn't running.
    await syncToNative(normalizedSettings);
  } catch (error) {
    console.error("Failed saving settings:", error);
  }
}

/**
 * Update endpoint only
 */
export async function updateEndpoint(
  storage_endpoint: string,
  storage_api_key = ""
): Promise<void> {
  const settings = await loadSettings();

  settings.storage_endpoint = storage_endpoint;
  settings.storage_api_key = storage_api_key;

  await saveSettings(settings);
}

/**
 * Reset settings
 */
export async function resetSettings(): Promise<void> {
  await saveSettings(defaultSettings);
}