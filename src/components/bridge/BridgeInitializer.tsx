"use client";

import { bridge } from "@/lib/bridge";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function BridgeInitializer({ isNative }: { isNative: boolean }) {
  const router = useRouter();

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
    const handleStateUpdate = (state: any) => {
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
        try {
          const url = new URL(state.lastDeepLink);
          if (url.origin === window.location.origin) {
            router.push(url.pathname + url.search + url.hash);
          }
        } catch (e) {
          if (state.lastDeepLink.startsWith("/")) {
            router.push(state.lastDeepLink);
          }
        }
      }

      // 3. Handle Notifications
      if (state.lastNotification) {
        // Custom logic for notification handling
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
