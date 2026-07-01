export interface Sms {
  id: string;
  sender: string;
  message: string;
  device_id: string;
  forwarded_by?: string;
  role?: string;
  read?: boolean;
  timestamp?: string;
}