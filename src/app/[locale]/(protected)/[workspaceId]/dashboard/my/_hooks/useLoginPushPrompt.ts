import { usePostNotificationsDevices } from "@/api/generated/notification/notification";
import {
  getAppVersion,
  getBridgeNotificationPermission,
  getBridgePlatform,
  getPushToken,
  isNativeApp,
  requestNotificationPermission,
} from "@/lib/bridge";
import { useEffect, useState } from "react";

export function useLoginPushPrompt() {
  const { mutateAsync: registerDevice } = usePostNotificationsDevices();
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || hasPrompted) {
      return;
    }

    const intent = window.sessionStorage.getItem("dowin.intent.push-prompt");
    if (intent !== "true") {
      return;
    }

    // Always remove intent so we only attempt this once
    window.sessionStorage.removeItem("dowin.intent.push-prompt");
    setHasPrompted(true);

    if (!isNativeApp()) {
      return;
    }

    const promptAndRegister = async () => {
      try {
        let currentPermission = getBridgeNotificationPermission();

        if (currentPermission !== "granted") {
          currentPermission = await requestNotificationPermission();
        }

        if (currentPermission !== "granted") {
          return;
        }

        // Wait a brief moment to ensure native UI is settled
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get token and register
        const token = await getPushToken();
        const appVersion = await getAppVersion();

        await registerDevice({
          data: {
            provider: "FCM",
            platform: getBridgePlatform(),
            token,
            appVersion: appVersion ?? undefined,
            notificationEnabled: true,
          },
        });
      } catch (error) {
        console.error("Failed to register push device after login prompt:", error);
      }
    };

    void promptAndRegister();
  }, [hasPrompted, registerDevice]);
}
