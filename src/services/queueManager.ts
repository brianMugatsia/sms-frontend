import {
  startNetworkListener,
  stopNetworkListener,
} from "./networkService";

import {
  refreshSmsDashboard,
} from "./syncService";

let started = false;

async function refreshDashboard() {
  try {
    await refreshSmsDashboard();
  } catch (e) {
    console.error("[SYNC] Dashboard refresh failed", e);
  }
}

export const startQueueManager = async () => {
  if (started) {
    console.log("[SYNC] Already started");
    return;
  }

  started = true;

  console.log("[SYNC] Starting dashboard sync manager");

  await refreshDashboard();

  startNetworkListener(async () => {
    console.log("[SYNC] Internet restored");

    await refreshDashboard();
  });
};

export const stopQueueManager = () => {
  if (!started) return;

  stopNetworkListener();

  started = false;

  console.log("[SYNC] Stopped");
};