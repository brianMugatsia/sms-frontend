import { useEffect } from "react";
import {
  startSmsForwarding,
  stopSmsForwarding,
} from "../services/smsForwarder";

export default function SmsForwarder() {
  useEffect(() => {
    let subscription: any;

    const init = async () => {
      subscription = await startSmsForwarding();
    };

    init();

    return () => {
      stopSmsForwarding(subscription);
    };
  }, []);

  return null;
}