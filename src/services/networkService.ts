import NetInfo, {
  NetInfoState,
} from "@react-native-community/netinfo";

let unsubscribe: (() => void) | null = null;

let isConnected = false;
let isInternetReachable = false;

/**
 * Current status
 */
export const getNetworkStatus = () => ({
  isConnected,
  isInternetReachable,
  online: isConnected && isInternetReachable,
});

/**
 * Check once
 */
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();

  return !!(
    state.isConnected &&
    state.isInternetReachable
  );
};

/**
 * Listen for connectivity changes
 */
export const startNetworkListener = (
  onOnline?: () => void,
  onOffline?: () => void
) => {
  if (unsubscribe) {
    return;
  }

  unsubscribe = NetInfo.addEventListener(
    (state: NetInfoState) => {
      const previous =
        isConnected && isInternetReachable;

      isConnected = !!state.isConnected;
      isInternetReachable =
        !!state.isInternetReachable;

      const current =
        isConnected && isInternetReachable;

      console.log(
        `[NETWORK] Connected=${isConnected} Reachable=${isInternetReachable}`
      );

      if (!previous && current) {
        console.log(
          "[NETWORK] Internet restored"
        );

        onOnline?.();
      }

      if (previous && !current) {
        console.log(
          "[NETWORK] Internet lost"
        );

        onOffline?.();
      }
    }
  );
};

/**
 * Stop listener
 */
export const stopNetworkListener = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};