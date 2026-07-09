import { loadSettings } from "./settingsService";

interface SmsData {
  sender: string;
}

export async function shouldForward({
  sender,
}: SmsData): Promise<boolean> {
  const settings = await loadSettings();

  if (!settings.enabled) {
    return false;
  }
http://127.0.0.1:8000
  if (settings.forwardAll) {
    return true;
  }

  if (!settings.keywords || settings.keywords.length === 0) {
    return false;
  }

  const senderLower = sender.trim().toLowerCase();

  return settings.keywords.some(
    (allowedSender) =>
      senderLower === allowedSender.trim().toLowerCase()
  );
}