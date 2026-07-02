export interface ForwardingSettings {
  // Master switch
  enabled: boolean;

  // Forward everything
  forwardAll: boolean;

  // Categories
  banking: boolean;
  mpesa: boolean;
  otp: boolean;
  contacts: boolean;
  unknown: boolean;
  promotions: boolean;
  personal: boolean;
}