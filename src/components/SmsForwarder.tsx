import { useEffect } from "react";

import {
  startSmsForwarding,
  stopSmsForwarding,
} from "../services/smsForwarder";

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

      await startSmsForwarding();

    };

    initialize();

    return () => {

      stopSmsForwarding();

      stopQueueManager();

      stopForegroundService();

    };

  }, []);

  return null;
}