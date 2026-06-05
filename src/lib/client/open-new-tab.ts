const NEW_TAB_FEATURES = "noopener,noreferrer";
const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

export const openNewTab = (url: string): Window | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parsedUrl = new URL(url, window.location.href);
    if (!SAFE_PROTOCOLS.has(parsedUrl.protocol)) {
      return null;
    }

    return window.open(parsedUrl.toString(), "_blank", NEW_TAB_FEATURES);
  } catch {
    return null;
  }
};
