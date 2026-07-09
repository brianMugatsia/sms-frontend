import * as Crypto from "expo-crypto";
import { findSMS } from "./databaseService";
import {
  saveSMS,
  getPendingSMS,
  deleteSMS,
  increaseRetry,
  getQueueSize,
  PendingSMS,
} from "./databaseService";

export interface QueueSMS {
  sender: string;
  message: string;
  device_id: string;
}


/**
 * Add SMS to queue
 */
export const enqueueSMS = async (
  sms: QueueSMS
): Promise<PendingSMS> => {
  const receivedAt = Date.now();

  const id = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${sms.sender}-${sms.message}-${sms.device_id}-${receivedAt}`
  );

  const existing = await findSMS(id);

  if (existing) {
    console.log("[QUEUE] Duplicate SMS ignored");
    return existing;
  }

  const pending: PendingSMS = {
    id,
    sender: sms.sender,
    message: sms.message,
    device_id: sms.device_id,
    received_at: receivedAt,
    retries: 0,
    synced: 0,
    created_at: receivedAt,
  };

  await saveSMS(pending);

  console.log(`[QUEUE] SMS queued (${pending.sender})`);

  return pending;
};
/**
 * Pending queue
 */
export const getQueue = async (): Promise<
  PendingSMS[]
> => {
  return await getPendingSMS();
};

/**
 * Remove after successful upload
 */
export const removeSMS = async (
  id: string
) => {
  await deleteSMS(id);

  console.log(
    `[QUEUE] Removed ${id}`
  );
};

/**
 * Retry counter
 */
export const markRetry = async (
  id: string
) => {
  await increaseRetry(id);
};

/**
 * Queue size
 */
export const queueSize = async () => {
  return await getQueueSize();
};

/**
 * Debug helper
 */
export const printQueue = async () => {
  const queue = await getQueue();

  console.log(
    "============== SMS QUEUE =============="
  );

  if (queue.length === 0) {
    console.log("Queue Empty");
    return;
  }

  queue.forEach((sms, index) => {
    console.log(
      `${index + 1}. ${sms.sender}`
    );

    console.log(
      `Message : ${sms.message}`
    );

    console.log(
      `Retries : ${sms.retries}`
    );

    console.log(
      `Queued  : ${new Date(
        sms.created_at
      ).toLocaleString()}`
    );

    console.log("--------------------------");
  });

  console.log(
    `Total Pending : ${queue.length}`
  );
};