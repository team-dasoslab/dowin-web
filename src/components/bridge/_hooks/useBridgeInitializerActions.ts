import type { AppBridgeState } from "@/types/bridge";
import { MutableRefObject } from "react";

export const useBridgeInitializerActions = (
  router: { push: (url: string) => void },
  processedDeepLink: MutableRefObject<string | null>,
  processedNotification: MutableRefObject<string | null>,
) => {
  const handleStateUpdate = (state: AppBridgeState) => {
    // 1. Sync Safe Area Insets to CSS Variables
    if (state.safeAreaInsets) {
      const root = document.documentElement;
      root.style.setProperty(
        "--safe-area-inset-top",
        `${state.safeAreaInsets.top}px`,
      );
      root.style.setProperty(
        "--safe-area-inset-bottom",
        `${state.safeAreaInsets.bottom}px`,
      );
      root.style.setProperty(
        "--safe-area-inset-left",
        `${state.safeAreaInsets.left}px`,
      );
      root.style.setProperty(
        "--safe-area-inset-right",
        `${state.safeAreaInsets.right}px`,
      );
      root.style.setProperty("--bridge-synced", "1");
    }

    // 2. Handle Deep Links
    if (state.lastDeepLink) {
      const processedSession = sessionStorage.getItem("processedDeepLink");
      if (
        state.lastDeepLink !== processedDeepLink.current &&
        state.lastDeepLink !== processedSession
      ) {
        processedDeepLink.current = state.lastDeepLink;
        sessionStorage.setItem("processedDeepLink", state.lastDeepLink);
        try {
          const url = new URL(state.lastDeepLink);
          if (url.origin === window.location.origin) {
            router.push(url.pathname + url.search + url.hash);
          }
        } catch {
          if (state.lastDeepLink.startsWith("/")) {
            router.push(state.lastDeepLink);
          }
        }
      }
    }

    // 3. Handle Notifications
    if (state.lastNotification) {
      const notificationStr = JSON.stringify(state.lastNotification);
      const processedSession = sessionStorage.getItem("processedNotification");

      if (
        notificationStr !== processedNotification.current &&
        notificationStr !== processedSession
      ) {
        processedNotification.current = notificationStr;
        sessionStorage.setItem("processedNotification", notificationStr);

        const url = state.lastNotification.url;
        if (typeof url === "string" && url) {
          try {
            const parsedUrl = new URL(url, window.location.origin);
            if (parsedUrl.origin === window.location.origin) {
              router.push(
                parsedUrl.pathname + parsedUrl.search + parsedUrl.hash,
              );
            } else {
              router.push(url);
            }
          } catch {
            if (url.startsWith("/")) {
              router.push(url);
            }
          }
        }
      }
    }
  };

  return { handleStateUpdate };
};
