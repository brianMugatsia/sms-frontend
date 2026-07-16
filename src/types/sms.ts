export interface Sms {
  id: string;
  sender: string;
  message: string;
  device_id: string;

  received_at: number;   // epoch milliseconds, when SMS was received on the phone
  timestamp: string;     // ISO datetime string, when the backend record was created

  status: string;        // e.g. "pending", "success", "failed"
  forwarded: boolean;

  response_code?: number | null;
  error?: string | null;

  // These three aren't in SmsResponse at all — see note below
  forwarded_by?: string;
  role?: string;
  read?: boolean;
}