import { queueSize } from "./smsQueueService";

export const monitorQueue = async () => {

    const size = await queueSize();

    console.log(`[MONITOR] Pending SMS : ${size}`);

};