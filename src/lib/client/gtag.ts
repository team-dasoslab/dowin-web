import { publicRuntimeConfig } from "@/config/public-runtime-config";

type GtagEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const gaId = publicRuntimeConfig.nextPublicGaId;

export function isGtagEnabled() {
  return gaId.length > 0;
}

export function trackEvent(eventName: string, params?: GtagEventParams) {
  if (!isGtagEnabled()) {
    return;
  }

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, params ?? {});
}
