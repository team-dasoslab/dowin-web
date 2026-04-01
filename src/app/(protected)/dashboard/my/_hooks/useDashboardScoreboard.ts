"use client";

import { useDashboardLogMutation } from "@/app/(protected)/dashboard/my/_hooks/useDashboardLogMutation";
import { useDashboardPeriodState } from "@/app/(protected)/dashboard/my/_hooks/useDashboardPeriodState";
import { useDashboardScoreboardQueries } from "@/app/(protected)/dashboard/my/_hooks/useDashboardScoreboardQueries";
import { useToast } from "@/context/ToastContext";

export const useDashboardScoreboard = () => {
  const { showToast } = useToast();
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
    isMonthlyLogsLoading,
    isWeeklyLogsLoading,
    isWeeklyTrendLoading,
    monthLabel,
    monthlyLeadMeasures,
    monthlyLogsQueryKey,
    monthlyOverallRate,
    monthlySummary,
    scoreboardError,
    scoreboardId,
    weeklyById,
    weeklyLogsQueryKey,
    weeklyOverallRate,
    weeklyTrendPoints,
    weekLabel,
    workspace,
    workspaceError,
  } = useDashboardScoreboardQueries({
    currentWeekDates,
    selectedMonthStart,
    selectedWeekStart,
    weekDates,
  });
  const { isLogPending, pendingLogKeys, toggleLog } = useDashboardLogMutation({
    dashboardTeamQueryKey,
    monthlyLogsQueryKey,
    scoreboardId,
    showToast,
    weeklyById,
    weeklyLogsQueryKey,
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
    monthlyLeadMeasures,
    monthlyOverallRate,
    monthlySummary,
    pendingLogKeys,
    scoreboardError,
    selectedDate,
    selectedView,
    setSelectedDate,
    setSelectedView,
    movePeriod,
    resetToToday,
    today,
    toggleLog,
    monthLabel,
    weekDates,
    weekLabel,
    weeklyOverallRate,
    weeklyTrendPoints,
    weeklyById,
    workspace,
    workspaceError,
  };
};
