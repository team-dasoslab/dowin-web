"use client";

import { usePutPushSettingsTimezone } from "@/api/generated/notification/notification";
import { useEffect, useRef } from "react";

const LAST_SYNCED_AT_KEY = "dowin.timezone.lastSyncedAt";
const LAST_SYNCED_TIMEZONE_KEY = "dowin.timezone.lastSyncedTimezone";
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function useTimezoneSync() {
  const hasCheckedRef = useRef(false);
  const syncTimezone = usePutPushSettingsTimezone();

  useEffect(() => {
    if (hasCheckedRef.current) {
      return;
    }
    hasCheckedRef.current = true;

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timezone) {
        return;
      }

      const lastSyncedTimezone = localStorage.getItem(
        LAST_SYNCED_TIMEZONE_KEY,
      );
      const lastSyncedAt = Number(localStorage.getItem(LAST_SYNCED_AT_KEY));
      const now = Date.now();
      const shouldSync =
        timezone !== lastSyncedTimezone ||
        !Number.isFinite(lastSyncedAt) ||
        now - lastSyncedAt >= SYNC_INTERVAL_MS;

      if (!shouldSync) {
        return;
      }

      void syncTimezone
        .mutateAsync({
          data: { timezone },
        })
        .then((response) => {
          if (response.status !== 200) {
            return;
          }

          localStorage.setItem(LAST_SYNCED_TIMEZONE_KEY, timezone);
          localStorage.setItem(LAST_SYNCED_AT_KEY, String(now));
        })
        .catch(() => {
          // Timezone sync is best-effort and should not block app entry.
        });
    } catch {
      // Timezone sync is best-effort and should not block app entry.
    }
  }, [syncTimezone]);
}
