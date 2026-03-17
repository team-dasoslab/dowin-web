"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const PREVIOUS_PATH_KEY = "wig.previousPath";
const CURRENT_PATH_KEY = "wig.currentPath";

export function NavigationHistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    const currentPath = sessionStorage.getItem(CURRENT_PATH_KEY);

    if (currentPath === nextPath) {
      return;
    }

    if (currentPath) {
      sessionStorage.setItem(PREVIOUS_PATH_KEY, currentPath);
    }

    sessionStorage.setItem(CURRENT_PATH_KEY, nextPath);
  }, [pathname, searchParams]);

  return null;
}
