export interface ForwardingSettings {
  enabled: boolean;
  forwardAll: boolean;

  // Sender names
  keywords: string[];

  // User storage endpoint
  storage_endpoint: string;

  // Optional API key
  storage_api_key: string;
}