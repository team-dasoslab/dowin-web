"use client";

import { useEffect } from "react";

export function useSerwistRegistration(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js");
  }, [enabled]);
}
