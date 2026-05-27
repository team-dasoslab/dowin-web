"use client";

import { useDashboardLogMutation } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardLogMutation";
import { useDashboardPeriodState } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardPeriodState";
import { useDashboardScoreboardQueries } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboardQueries";
import { DashboardView } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { addDays, addMonths } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { useToast } from "@/context/ToastContext";
import { getApiErrorCode, getApiErrorStatus } from "@/lib/client/frontend-api";
import { useCallback, useMemo, useTransition } from "react";

export const useDashboardScoreboard = (workspaceId: string) => {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const {
    currentWeekDates,
    movePeriod,
    resetToToday,
    selectedDate,
    selectedMonthStart,
    selectedView,
    selectedWeekStart,
    setSelectedDate,
    setSelectedView,
    today,
    weekDates,
  } = useDashboardPeriodState();

  const {
    activeLeadMeasures,
    activeScoreboard,
    dashboardTeamQueryKey,
    hasNoScoreboard,
    hasNoWorkspace,
    isLoading,
    isMonthlyLogsFetching,
    isMonthlyLogsLoading,
    isWeeklyLogsFetching,
    isWeeklyLogsLoading,
    isWeeklyTrendLoading,
    monthLabel,
    monthlyLeadMeasures,
    monthlyLogsError,
    monthlyLogsQueryKey,
    monthlyOverallRate,
    monthlySummary,
    scoreboardError,
    scoreboardId,
    weekLabel,
    weeklyById,
    weeklyGuideById,
    weeklyLogsError,
    weeklyLogsQueryKey,
    weeklyOverallRate,
    weeklyTrendPoints,
    workspace,
    workspaceError,
  } = useDashboardScoreboardQueries({
    workspaceId,
    currentWeekDates,
    selectedMonthStart,
    selectedView: selectedView as DashboardView,
    selectedWeekStart,
    weekDates,
  });

  const isFreePlan = workspace?.planCode === "FREE" || !workspace?.planCode;

  // 6개월 제한 날짜 계산
  const historyLimitDate = useMemo(() => {
    const [tY, tM] = today.split("-").map(Number);
    const limitDate = new Date(Date.UTC(tY, tM - 6, 1));
    return limitDate.toISOString().slice(0, 10);
  }, [today]);

  const checkHistoryLimit = useCallback(
    (date: string, view: "week" | "month") => {
      if (!isFreePlan) return true;
      const checkDate = view === "week" ? addDays(date, 6) : date;
      return checkDate >= historyLimitDate;
    },
    [isFreePlan, historyLimitDate],
  );

  const handleMovePeriod = (direction: -1 | 1) => {
    const nextDate =
      selectedView === "month"
        ? addMonths(selectedDate, direction)
        : addDays(selectedWeekStart, direction * 7);

    if (
      direction === -1 &&
      !checkHistoryLimit(nextDate, selectedView as "week" | "month")
    ) {
      // 선제 방어로 막을 때는 조용히 리턴 (오버레이가 보일 것이므로)
      return;
    }
    startTransition(() => {
      movePeriod(direction);
    });
  };

  const handleSetSelectedDate = (date: string) => {
    // 캘린더 선택은 일단 허용하되, 에러가 나면 오버레이가 보이게 함
    startTransition(() => {
      setSelectedDate(date);
    });
  };

  const handleSetSelectedView = (view: DashboardView) => {
    startTransition(() => {
      setSelectedView(view);
    });
  };

  const isPreviousDisabled = useMemo(() => {
    if (!isFreePlan) return false;
    const nextDate =
      selectedView === "month"
        ? addMonths(selectedDate, -1)
        : addDays(selectedWeekStart, -7);
    return !checkHistoryLimit(nextDate, selectedView as "week" | "month");
  }, [
    isFreePlan,
    selectedDate,
    selectedView,
    selectedWeekStart,
    checkHistoryLimit,
  ]);

  const isHistoryLimited = useMemo(() => {
    const error = weeklyLogsError ?? monthlyLogsError;
    return !!(
      error &&
      getApiErrorStatus(error) === 403 &&
      getApiErrorCode(error) === "FREE_PLAN_HISTORY_LIMIT_REACHED"
    );
  }, [weeklyLogsError, monthlyLogsError]);

  const isTrendLimited = useMemo(() => {
    if (!isFreePlan) return false;
    // 3주 전의 월요일을 계산합니다. (차트의 가장 왼쪽 바)
    const threeWeeksAgo = addDays(selectedWeekStart, -21);
    return !checkHistoryLimit(threeWeeksAgo, "week");
  }, [isFreePlan, selectedWeekStart, checkHistoryLimit]);

  const { isLogPending, pendingLogKeys, toggleLog } = useDashboardLogMutation({
    scoreboardId,
    selectedView: selectedView as DashboardView,
    showToast,
    weeklyById,
    weeklyLogsQueryKey,
    workspaceId,
  });

  return {
    activeLeadMeasures,
    activeScoreboard,
    hasNoScoreboard,
    hasNoWorkspace,
    isLoading,
    isLogPending,
    isMonthlyLogsLoading,
    isWeeklyTrendLoading,
    isWeeklyLogsLoading,
    isPeriodLoading: isPending || isMonthlyLogsFetching || isWeeklyLogsFetching,
    isHistoryLimited,
    isTrendLimited,
    monthlyLeadMeasures,
    monthlyOverallRate,
    monthlySummary,
    pendingLogKeys,
    scoreboardError,
    selectedDate,
    selectedView,
    setSelectedDate: handleSetSelectedDate,
    setSelectedView: handleSetSelectedView,
    movePeriod: handleMovePeriod,
    resetToToday,
    today,
    toggleLog,
    monthLabel,
    weekDates,
    weekLabel,
    weeklyGuideById,
    weeklyOverallRate,
    weeklyTrendPoints,
    weeklyById,
    workspace,
    workspaceError,
    historyLimitDate: isFreePlan ? historyLimitDate : undefined,
    isPreviousDisabled,
  };
};
