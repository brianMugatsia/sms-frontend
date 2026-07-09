import { syncPendingSMS } from "./syncService";

let retryTimer: NodeJS.Timeout | null = null;

const BASE_DELAY = 5000;
const MAX_DELAY = 300000;

let currentDelay = BASE_DELAY;

export const scheduleRetry = () => {

    if (retryTimer) {
        return;
    }

    console.log(
        `[RETRY] Next retry in ${currentDelay / 1000}s`
    );

    retryTimer = setTimeout(async () => {

        retryTimer = null;

        await syncPendingSMS();

    }, currentDelay);

    currentDelay = Math.min(
        currentDelay * 2,
        MAX_DELAY
    );

};

export const resetRetry = () => {

    currentDelay = BASE_DELAY;

    if (retryTimer) {

        clearTimeout(retryTimer);

        retryTimer = null;

    }

};