import {
  startNetworkListener,
  stopNetworkListener,
} from "./networkService";

import {
  syncPendingSMS,
} from "./syncService";

import {
  cleanupOldSMS,
} from "./databaseService";

let started = false;

export const startQueueManager = async () => {
  if (started) {
    console.log("[QUEUE] Already started");
    return;
  }

  started = true;

  console.log("[QUEUE] Starting Queue Manager");

  // Clean very old queued SMS
  await cleanupOldSMS();

  // Process any pending SMS from previous runs
  await syncPendingSMS();

  // Listen for internet recovery
  startNetworkListener(async () => {
    console.log("[QUEUE] Internet restored");

    await syncPendingSMS();
  });
};

export const stopQueueManager = () => {
  if (!started) return;

  stopNetworkListener();

  started = false;

  console.log("[QUEUE] Stopped");
};