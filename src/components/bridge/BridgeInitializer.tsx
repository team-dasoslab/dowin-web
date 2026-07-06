"use client";

import { useBridgeInitializerActions } from "@/components/bridge/_hooks/useBridgeInitializerActions";
import { bridge } from "@/lib/bridge";
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

  const { handleStateUpdate } = useBridgeInitializerActions(
    router,
    processedDeepLink,
    processedNotification,
  );

  useEffect(() => {
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
