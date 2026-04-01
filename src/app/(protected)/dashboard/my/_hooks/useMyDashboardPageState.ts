"use client";

import {
  canPlayCelebration,
  fireDashboardConfetti,
  getCelebrationToastMessage,
  getNextCelebrationEvent,
  type CelebrationEvent,
  type CelebrationLevel,
} from "@/app/(protected)/dashboard/my/_lib/dashboard-celebration";
import {
  getCompletedWeeklyMeasureIds,
  getWeeklyCelebrationSnapshot,
  type WeeklyCelebrationSnapshot,
} from "@/app/(protected)/dashboard/my/_lib/weekly-celebration";
import {
  dismissProductUpdate,
  getLatestMajorProductUpdate,
  isProductUpdateDismissed,
  readDismissedProductUpdate,
} from "@/lib/product-updates";
import { useEffect, useRef, useState } from "react";

type UseMyDashboardPageStateParams = {
  activeLeadMeasures: Array<{
    id?: string | number;
    name?: string | null;
    period?: string;
    targetValue?: number | null;
  }>;
  isLogPending: boolean;
  selectedView: "week" | "month";
  showToast: (type: "success" | "error", message: string) => void;
  weeklyById: Map<number | null, { achieved?: number | null }>;
};

export const useMyDashboardPageState = ({
  activeLeadMeasures,
  isLogPending,
  selectedView,
  showToast,
  weeklyById,
}: UseMyDashboardPageStateParams) => {
  const [isUpdateCardVisible, setIsUpdateCardVisible] = useState(false);
  const [celebrationEvent, setCelebrationEvent] =
    useState<CelebrationEvent | null>(null);
  const previousWeeklySnapshotRef = useRef<WeeklyCelebrationSnapshot | null>(
    null,
  );
  const previousCompletedMeasureIdsRef = useRef<Set<number>>(new Set());
  const celebrationWatchRef = useRef(false);
  const weeklyCelebrationSnapshot = getWeeklyCelebrationSnapshot(
    activeLeadMeasures,
    weeklyById,
  );
  const latestMajorUpdate = getLatestMajorProductUpdate();

  useEffect(() => {
    if (!latestMajorUpdate) {
      setIsUpdateCardVisible(false);
      return;
    }

    const dismissed = readDismissedProductUpdate();
    setIsUpdateCardVisible(
      !isProductUpdateDismissed(latestMajorUpdate.id, dismissed),
    );
  }, [latestMajorUpdate]);

  useEffect(() => {
    const previousSnapshot = previousWeeklySnapshotRef.current;
    const previousCompletedMeasureIds = previousCompletedMeasureIdsRef.current;
    previousWeeklySnapshotRef.current = weeklyCelebrationSnapshot;
    previousCompletedMeasureIdsRef.current = getCompletedWeeklyMeasureIds(
      activeLeadMeasures,
      weeklyById,
    );

    if (
      previousSnapshot === null ||
      selectedView !== "week" ||
      !celebrationWatchRef.current
    ) {
      return;
    }

    if (
      weeklyCelebrationSnapshot.totalCount === 0 ||
      weeklyCelebrationSnapshot.completedCount <=
        previousSnapshot.completedCount
    ) {
      if (!isLogPending) {
        celebrationWatchRef.current = false;
      }
      return;
    }

    celebrationWatchRef.current = false;

    setCelebrationEvent(
      getNextCelebrationEvent({
        activeLeadMeasures,
        nextSnapshot: weeklyCelebrationSnapshot,
        previousSnapshot,
        previousCompletedMeasureIds,
        weeklyById,
      }),
    );
  }, [
    activeLeadMeasures,
    isLogPending,
    selectedView,
    weeklyById,
    weeklyCelebrationSnapshot,
  ]);

  useEffect(() => {
    if (!canPlayCelebration(celebrationEvent, isLogPending)) {
      return;
    }

    void fireDashboardConfetti(celebrationEvent.level);
    showToast("success", getCelebrationToastMessage(celebrationEvent));

    const timeout = window.setTimeout(() => {
      setCelebrationEvent((current) =>
        current?.id === celebrationEvent.id ? null : current,
      );
    }, 2800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [celebrationEvent, isLogPending, showToast]);

  return {
    celebrationLevel: canPlayCelebration(celebrationEvent, isLogPending)
      ? (celebrationEvent.level as CelebrationLevel)
      : null,
    handleDismissProductUpdate: () => {
      if (!latestMajorUpdate) {
        return;
      }

      dismissProductUpdate(latestMajorUpdate.id);
      setIsUpdateCardVisible(false);
    },
    isUpdateCardVisible,
    latestMajorUpdate,
    markCelebrationPending: () => {
      celebrationWatchRef.current = true;
    },
  };
};
