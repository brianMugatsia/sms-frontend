import api from "./api";

let backendAvailable = false;

export const isBackendAvailable = () => backendAvailable;

/**
 * Checks if backend is reachable.
 */
export const checkBackend = async (): Promise<boolean> => {

  try {

    await api.get("/health", {
      timeout: 5000,
    });

    backendAvailable = true;

    return true;

  } catch (error) {

    backendAvailable = false;

    return false;

  }

};

/**
 * Wait until backend is alive.
 */
export const waitForBackend = async () => {

  const healthy = await checkBackend();

  if (!healthy) {

    console.log("[HEALTH] Backend unavailable");

    return false;

  }

  console.log("[HEALTH] Backend available");

  return true;

};