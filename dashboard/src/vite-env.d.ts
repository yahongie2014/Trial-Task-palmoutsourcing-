/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface HiddenDealsConfig {
  apiUrl: string;
  nonce?: string;
  adminUrl?: string;
}

declare global {
  interface Window {
    hiddenDealsConfig?: HiddenDealsConfig;
  }
}
