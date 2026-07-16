import AsyncStorage from "@react-native-async-storage/async-storage";
import { ForwardingSettings } from "../types/settings";

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
 * Load settings
 */
export async function loadSettings(): Promise<ForwardingSettings> {
  try {
    const value = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!value) {
      return defaultSettings;
    }

    const parsed = JSON.parse(value);

    // Backward compatibility helper: if someone updated via legacy camelCase keys,
    // map them cleanly over to snake_case.
    return {
      ...defaultSettings,
      ...parsed,
      storage_endpoint: parsed.storage_endpoint ?? parsed.storageEndpoint ?? defaultSettings.storage_endpoint,
      storage_api_key: parsed.storage_api_key ?? parsed.storageApiKey ?? defaultSettings.storage_api_key,
    };
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