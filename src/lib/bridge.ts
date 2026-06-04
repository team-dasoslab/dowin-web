import type { AppBridge, AppBridgeMethods } from "@/types/bridge";
import { openNewTab } from "@/lib/client/open-new-tab";
import { linkBridge } from "@webview-bridge/web";

export const bridge = linkBridge<AppBridge>({
  throwOnError: false, // Don't throw if bridge is not available, just return undefined or do nothing
  initialBridge: {
    isNative: false,
    platform: "ios",
    appState: "active",
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    statusBarHeight: 0,
    notificationPermission: "not-determined",
    lastNotification: null,
    lastDeepLink: null,
  },
});

/**
 * Check if the current environment is the Dowin Native App.
 * This is based on the bridge's isNative state.
 */
export const isNativeApp = () => {
  try {
    return bridge.isWebViewBridgeAvailable;
  } catch {
    return false;
  }
};

/**
 * Haptic feedback helper with browser fallback.
 */
export const vibrate = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: AppBridgeMethods["vibrate"] extends (arg: infer T) => any ? T : never,
) => {
  if (isNativeApp()) {
    return bridge.vibrate(type);
  }
  // Browser fallback: minimal vibration if supported
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
};

/**
 * Native share helper with browser fallback.
 */
export const share = async (options: {
  title?: string;
  message?: string;
  url?: string;
}) => {
  if (isNativeApp()) {
    return bridge.share(options);
  }
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.message,
        url: options.url,
      });
    } catch (error) {
      console.error("Browser share failed:", error);
    }
  } else {
    // Fallback: Copy to clipboard or alert
    if (options.url) {
      alert(`Share link: ${options.url}`);
    }
  }
};

/**
 * Open URL in system browser helper.
 */
export const openInBrowser = async (url: string) => {
  if (isNativeApp()) {
    return bridge.openInBrowser(url);
  }
  openNewTab(url);
};

/**
 * Request notification permission helper.
 */
export const requestNotificationPermission = async () => {
  if (isNativeApp()) {
    return bridge.requestNotificationPermission();
  }
  return "denied";
};

/**
 * Get push token helper.
 */
export const getPushToken = async () => {
  if (isNativeApp()) {
    return bridge.getPushToken();
  }
  throw new Error("Push token is only available in the native app.");
};

export const getBridgePlatform = () => {
  const platform = bridge.store.getState().platform;

  return platform === "android" ? "ANDROID" : "IOS";
};

export const getBridgeNotificationPermission = () => {
  return bridge.store.getState().notificationPermission;
};

export const getAppVersion = async () => {
  if (isNativeApp()) {
    return bridge.getAppVersion();
  }

  return null;
};
