import Contacts from "react-native-contacts";
import { AppState, PermissionsAndroid, Platform } from "react-native";

const contactsMap = new Map<string, string>();

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-9);
}

export async function loadContacts() {
  if (Platform.OS !== "android") return;

  if (contactsMap.size > 0) {
    return;
  }

  let granted = false;

  try {
    // Check first — doesn't require an Activity, safe to call
    // during headless/background JS restarts.
    granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS
    );

    if (!granted) {
      if (AppState.currentState === "active") {
        // Only attempt the actual request dialog if we're in the
        // foreground — requesting with no Activity attached throws
        // E_INVALID_ACTIVITY.
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS
        );
        granted = permission === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        console.log(
          "[CONTACTS] App not in foreground, skipping permission request"
        );
      }
    }
  } catch (error) {
    console.error("Contacts permission check/request failed:", error);
    return;
  }

  if (!granted) {
    console.log("READ_CONTACTS permission denied or not yet grantable");
    return;
  }

  try {
    const contacts = await Contacts.getAll();

    contacts.forEach((contact) => {
      contact.phoneNumbers.forEach((number) => {
        const phone = normalizePhone(number.number);

        if (phone) {
          contactsMap.set(
            phone,
            contact.displayName || "Unknown"
          );
        }
      });
    });

    console.log(
      `Loaded ${contactsMap.size} phone numbers from contacts`
    );
  } catch (error) {
    console.error("Failed to load contacts:", error);
  }
}

export function getContactName(phone: string): string | null {
  if (!phone) return null;

  const normalized = normalizePhone(phone);

  return contactsMap.get(normalized) ?? null;
}