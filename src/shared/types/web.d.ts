// Web-specific type declarations for React Native Web

declare global {
  interface Window {
    confirm: (message: string) => boolean;
    alert: (message: string) => void;
  }
}

export {};
