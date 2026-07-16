import { Linking, Platform } from "react-native";

/**
 * Opens the app's own settings page so the user can manually
 * disable battery optimization if they choose to. This is the
 * Play Store-safe approach — no special permission required.
 */
export const openBatterySettings = async () => {
  if (Platform.OS !== "android") return;

  try {
    await Linking.openSettings();
  } catch (e) {
    console.warn("Could not open app settings", e);
  }
};