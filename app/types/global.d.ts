// Google Analytics
interface Window {
  gtag: (
    command: 'event' | 'config' | 'js' | 'set',
    eventName: string,
    eventParams?: {
      [key: string]: any;
    }
  ) => void;
  dataLayer: any[];
} 