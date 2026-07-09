import { forwardSms } from "./api";

import {
  scheduleRetry,
  resetRetry,
} from "./retryService";

import {
  getQueue,
  removeSMS,
  markRetry,
} from "./smsQueueService";

import { monitorQueue } from "./monitorService";

import { waitForBackend } from "./healthService";

import { isOnline } from "./networkService";

let syncing = false;

export const syncPendingSMS = async () => {

  if (syncing) {

    console.log("[SYNC] Already running");

    return;

  }

  syncing = true;

  try {

    const online = await isOnline();

    if (!online) {

      console.log("[SYNC] Offline");

      return;

    }

    const healthy = await waitForBackend();

    if (!healthy) {

      console.log("[SYNC] Backend unavailable");

      return;

    }

    const queue = await getQueue();

    if (queue.length === 0) {

      console.log("[SYNC] Queue empty");

      return;

    }

    console.log(
      `[SYNC] Uploading ${queue.length} SMS`
    );

    for (const sms of queue) {

      try {

        await forwardSms({

          id: sms.id,

          sender: sms.sender,

          message: sms.message,

          device_id: sms.device_id,

          received_at: sms.received_at,

        });

        await removeSMS(sms.id);

        await monitorQueue();

        resetRetry();

        console.log(
          `[SYNC] Success ${sms.id}`
        );

      } catch (e) {

        console.log(
          `[SYNC] Failed ${sms.id}`
        );

        await markRetry(sms.id);

        scheduleRetry();

        break;

      }

    }

  } finally {

    syncing = false;

  }

};

export const startSyncService = async () => {

  console.log("[SYNC] Starting");

  await syncPendingSMS();

};