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
  storageEndpoint: "",

  // Optional API key
  storageApiKey: "",
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

    return {
      ...defaultSettings,
      ...JSON.parse(value),
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
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error("Failed saving settings:", error);
  }
}

/**
 * Update endpoint only
 */
export async function updateEndpoint(
  storageEndpoint: string,
  storageApiKey = ""
): Promise<void> {
  const settings = await loadSettings();

  settings.storageEndpoint = storageEndpoint;
  settings.storageApiKey = storageApiKey;

  await saveSettings(settings);
}

/**
 * Reset settings
 */
export async function resetSettings(): Promise<void> {
  await saveSettings(defaultSettings);
}