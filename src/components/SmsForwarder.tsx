import { useEffect } from "react";

import {
  startSmsForwarding,
  stopSmsForwarding,
} from "../services/smsForwarder";

import {
  startQueueManager,
  stopQueueManager,
} from "../services/queueManager";

export default function SmsForwarder() {

  useEffect(() => {

    const initialize = async () => {

      await startQueueManager();

      await startSmsForwarding();

    };

    initialize();

    return () => {

      stopSmsForwarding();

      stopQueueManager();

    };

  }, []);

  return null;
}