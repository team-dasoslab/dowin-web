type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = {
  [key: string]: JsonValue;
};

export type AppBridgeState = {
  isNative: boolean;
  platform: "ios" | "android";
  appState: "active" | "background" | "inactive";
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  statusBarHeight: number;
  notificationPermission: "granted" | "denied" | "not-determined";
  lastNotification: JsonObject | null;
  lastDeepLink: string | null;
};

export type AppBridgeMethods = {
  setStatusBar(style: "light" | "dark", animated?: boolean): Promise<void>;
  vibrate(
    type:
      | "impactLight"
      | "impactMedium"
      | "impactHeavy"
      | "notificationSuccess"
      | "notificationWarning"
      | "notificationError"
      | "selection",
  ): Promise<void>;
  share(options: {
    title?: string;
    message?: string;
    url?: string;
  }): Promise<void>;
  requestAppReview(): Promise<void>;
  openInBrowser(url: string): Promise<void>;
  requestNotificationPermission(): Promise<"granted" | "denied">;
  getPushToken(): Promise<string>;
  getAppVersion(): Promise<string>;
};

export type AppBridge = AppBridgeState & AppBridgeMethods;
