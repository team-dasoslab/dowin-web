"use client";

import { trackEvent } from "@/lib/client/gtag";
import { useEffect } from "react";

type PushNotificationClickMessage = {
  type: "push-notification-clicked";
  payload?: {
    targetPath?: string;
    pushType?: string;
    campaignId?: string;
  };
};

const isPushNotificationClickMessage = (
  data: unknown,
): data is PushNotificationClickMessage => {
  if (!data || typeof data !== "object") {
    return false;
  }

  return (
    "type" in data &&
    data.type === "push-notification-clicked"
  );
};

export function usePushNotificationAnalytics(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent<unknown>) => {
      if (!isPushNotificationClickMessage(event.data)) {
        return;
      }

      trackEvent("push_notification_clicked", {
        campaign_id: event.data.payload?.campaignId ?? "unknown",
        push_type: event.data.payload?.pushType ?? "unknown",
        target_path: event.data.payload?.targetPath ?? "/dashboard/my",
      });
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [enabled]);
}
