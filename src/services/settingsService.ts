import AsyncStorage from "@react-native-async-storage/async-storage";
import { ForwardingSettings } from "../types/settings";

const SETTINGS_KEY = "forwarding_settings";

export const defaultSettings: ForwardingSettings = {
  // Master switch
  enabled: true,

  // Forward everything
  forwardAll: true,

  // Categories
  banking: true,
  mpesa: true,
  otp: true,
  contacts: false,
  unknown: false,
  promotions: false,
  personal: false,
};

/**
 * Load saved settings.
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
 * Save settings.
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
 * Reset to defaults.
 */
export async function resetSettings(): Promise<void> {
  await saveSettings(defaultSettings);
}