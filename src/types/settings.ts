export interface ForwardingSettings {
  enabled: boolean;
  forwardAll: boolean;

  // Sender names
  keywords: string[];

  // User storage endpoint
  storageEndpoint: string;

  // Optional API key
  storageApiKey: string;
}