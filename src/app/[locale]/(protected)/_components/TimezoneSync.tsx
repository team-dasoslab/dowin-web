"use client";

import { useTimezoneSync } from "@/app/[locale]/(protected)/_hooks/useTimezoneSync";

export function TimezoneSync() {
  useTimezoneSync();
  return null;
}
