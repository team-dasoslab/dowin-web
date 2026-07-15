"use client";

import { useDashboardLogMutation } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardLogMutation";
import { useDashboardPeriodState } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardPeriodState";
import { useDashboardScoreboardQueries } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboardQueries";
import { DashboardView } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { useToast } from "@/context/ToastContext";
import { useTransition } from "react";

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
    currentStreak,
    currentCheckinStreak,
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
    monthlyLogsQueryKey,
    monthlySummaryQueryKey,
    myDashboardQueryKey,
    monthlyOverallRate,
    monthlySummary,
    scoreboardError,
    scoreboardId,
    weekLabel,
    weeklyById,
    weeklyGuideById,
    weeklyLogsQueryKey,
    weeklyOverallRate,
    weeklyTrendPoints,
    workspace,
    workspaceError,
  } = useDashboardScoreboardQueries({
    workspaceId,
    currentWeekDates,
    selectedMonthStart,
    selectedWeekStart,
    selectedView,
    weekDates,
  });

  const handleMovePeriod = (direction: -1 | 1) => {
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

  const { isLogPending, pendingLogKeys, toggleLog } = useDashboardLogMutation({
    scoreboardId,
    selectedView: selectedView as DashboardView,
    showToast,
    weeklyById,
    weeklyLogsQueryKey,
    monthlyLogsQueryKey,
    monthlySummaryQueryKey,
    myDashboardQueryKey,
    workspaceId,
  });

  return {
    activeLeadMeasures,
    activeScoreboard,
    currentStreak,
    currentCheckinStreak,
    hasNoScoreboard,
    hasNoWorkspace,
    isLoading,
    isLogPending,
    isMonthlyLogsLoading,
    isWeeklyTrendLoading,
    isWeeklyLogsLoading,
    isPeriodLoading: isPending || isMonthlyLogsFetching || isWeeklyLogsFetching,
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
    isPreviousDisabled: false,
  };
};
