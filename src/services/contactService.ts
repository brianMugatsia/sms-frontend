import Contacts from "react-native-contacts";
import { PermissionsAndroid, Platform } from "react-native";

const contactsMap = new Map<string, string>();

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-9);
}

export async function loadContacts() {
  if (Platform.OS !== "android") return;

  if (contactsMap.size > 0) {
    return;
  }

  const permission = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_CONTACTS
  );

  if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
    console.log("READ_CONTACTS permission denied");
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