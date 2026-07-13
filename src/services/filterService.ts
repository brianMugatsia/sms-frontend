import { loadSettings } from "./settingsService";
import { getContactName } from "./contactService";

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

  if (settings.forwardAll) {
    return true;
  }

  if (!settings.keywords || settings.keywords.length === 0) {
    return false;
  }

  const contactName = getContactName(sender);
  const nameToCheck = (contactName ?? sender).trim().toLowerCase();

  return settings.keywords.some(
    (allowedName) =>
      nameToCheck === allowedName.trim().toLowerCase()
  );
}