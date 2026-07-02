import { useEffect } from "react";
import {
  startSmsForwarding,
  stopSmsForwarding,
} from "../services/smsForwarder";

export default function SmsForwarder() {
  useEffect(() => {
    startSmsForwarding();

    return () => {
      stopSmsForwarding();
    };
  }, []);

  return null;
}