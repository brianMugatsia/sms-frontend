import { useEffect } from "react";

import {
  startQueueManager,
  stopQueueManager,
} from "../services/queueManager";

import {
  startForegroundService,
  stopForegroundService,
} from "../services/foregroundService";

export default function SmsForwarder() {

  useEffect(() => {

    const initialize = async () => {

      await startForegroundService();

      await startQueueManager();

    };

    initialize();

    return () => {

      stopQueueManager();

      stopForegroundService();

    };

  }, []);

  return null;
}