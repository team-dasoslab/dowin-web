"use client";

import { bridge } from "@/lib/bridge";
import type { AppBridgeState } from "@/types/bridge";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function BridgeInitializer({ isNative }: { isNative: boolean }) {
  const router = useRouter();
  const processedDeepLink = useRef<string | null>(null);
  const processedNotification = useRef<string | null>(null);

  useEffect(() => {
    if (isNative) {
      document.documentElement.classList.add("is-native");

      // Safety timeout: Ensure app becomes visible even if bridge fails
      const timeout = setTimeout(() => {
        document.documentElement.style.setProperty("--bridge-synced", "1");
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isNative]);

  useEffect(() => {
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
        if (state.lastDeepLink !== processedDeepLink.current && state.lastDeepLink !== processedSession) {
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
        
        if (notificationStr !== processedNotification.current && notificationStr !== processedSession) {
          processedNotification.current = notificationStr;
          sessionStorage.setItem("processedNotification", notificationStr);
          
          const url = state.lastNotification.url;
          if (typeof url === "string" && url) {
            try {
              const parsedUrl = new URL(url, window.location.origin);
              if (parsedUrl.origin === window.location.origin) {
                router.push(parsedUrl.pathname + parsedUrl.search + parsedUrl.hash);
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

    // Process initial state
    handleStateUpdate(bridge.store.getState());

    // Subscribe to future changes
    const unsubscribe = bridge.store.subscribe(handleStateUpdate);

    return () => {
      unsubscribe();
    };
  }, [router]);

  return null;
}
