import { loadSettings } from "./settingsService";

const BANK_SENDERS = [
  "KCB",
  "EQUITY",
  "CO-OP",
  "COOP",
  "NCBA",
  "ABSA",
  "DTB",
  "STANBIC",
  "I&M",
  "FAMILY",
];

const MPESA_SENDERS = [
  "MPESA",
  "M-PESA",
  "SAFARICOM",
];

const OTP_KEYWORDS = [
  "otp",
  "verification",
  "verification code",
  "one time password",
  "security code",
  "code",
  "pin",
];

const PROMOTION_KEYWORDS = [
  "offer",
  "promo",
  "discount",
  "win",
  "airtime",
  "bundle",
  "buy",
  "free",
];

export async function shouldForward(message: {
  sender: string;
  body: string;
}): Promise<boolean> {
  const settings = await loadSettings();

  // Master switch
  if (!settings.enabled) {
    console.log("Forwarding is disabled");
    return false;
  }

  // Forward everything
  if (settings.forwardAll) {
    console.log("Forward All enabled");
    return true;
  }

  const sender = message.sender.toUpperCase();
  const body = message.body.toLowerCase();

  // MPESA
  if (
    settings.mpesa &&
    MPESA_SENDERS.some((item) => sender.includes(item))
  ) {
    console.log("Matched MPESA");
    return true;
  }

  // Banking
  if (
    settings.banking &&
    BANK_SENDERS.some((item) => sender.includes(item))
  ) {
    console.log("Matched Banking");
    return true;
  }

  // OTP
  if (
    settings.otp &&
    OTP_KEYWORDS.some((item) => body.includes(item))
  ) {
    console.log("Matched OTP");
    return true;
  }

  // Promotions
  if (
    settings.promotions &&
    PROMOTION_KEYWORDS.some((item) => body.includes(item))
  ) {
    console.log("Matched Promotion");
    return true;
  }

  // Unknown numbers
  if (
    settings.unknown &&
    sender.startsWith("+")
  ) {
    console.log("Matched Unknown Number");
    return true;
  }

  // Contacts
  // (To be implemented later)
  if (settings.contacts) {
    console.log("Contacts filtering not implemented yet");
  }

  // Personal messages
  if (settings.personal) {
    console.log("Matched Personal");
    return true;
  }

  console.log("SMS rejected by all rules");

  return false;
}