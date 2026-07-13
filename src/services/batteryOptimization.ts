import { NativeModules, Platform } from 'react-native';
import { Linking } from 'react-native';

export const requestBatteryOptimizationExemption = async () => {
  if (Platform.OS !== 'android') return;

  // This opens the system settings screen where the user can
  // manually exempt your app — there's no fully silent API call
  // for this without a native module, so we deep-link to settings.
  try {
    await Linking.sendIntent('android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS');
  } catch (e) {
    console.warn('Could not open battery optimization settings', e);
  }
};