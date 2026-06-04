const NEW_TAB_FEATURES = "noopener,noreferrer";

export const openNewTab = (url: string): Window | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.open(url, "_blank", NEW_TAB_FEATURES);
};
