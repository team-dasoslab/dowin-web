"use client";

import {
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlyQueryKey,
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlySummaryQueryKey,
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyQueryKey,
} from "@/api/generated/daily-log/daily-log";
import type { getWorkspacesWorkspaceIdDashboardMyResponse } from "@/api/generated/dashboard/dashboard";
import {
  getGetWorkspacesWorkspaceIdDashboardMyQueryKey,
  getGetWorkspacesWorkspaceIdDashboardTeamQueryKey,
  useGetWorkspacesWorkspaceIdDashboardMy,
} from "@/api/generated/dashboard/dashboard";
import {
  GetWorkspacesWorkspaceIdDashboardMyParams,
  GetWorkspacesWorkspaceIdDashboardTeamParams,
  GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlyParams,
  GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlySummaryParams,
  GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyParams,
} from "@/api/generated/dowin.schemas";
import { type WeeklyTrendPoint } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { getApiErrorStatus, toNumberId } from "@/lib/client/frontend-api";

type UseDashboardScoreboardQueriesParams = {
  workspaceId: string;
  currentWeekDates: string[];
  selectedMonthStart: string;
  selectedWeekStart: string;
  selectedView: "week" | "month";
  weekDates: string[];
  initialDashboard?: getWorkspacesWorkspaceIdDashboardMyResponse;
};

export const useDashboardScoreboardQueries = ({
  workspaceId,
  currentWeekDates,
  selectedMonthStart,
  selectedWeekStart,
  selectedView,
  weekDates,
  initialDashboard,
}: UseDashboardScoreboardQueriesParams) => {
  const myDashboardParams: GetWorkspacesWorkspaceIdDashboardMyParams = {
    monthStart: selectedMonthStart,
    view: selectedView,
    weekStart: selectedWeekStart,
  };
  const {
    data: myDashboardResponse,
    isLoading: isDashboardLoading,
    isFetching: isDashboardFetching,
    error: dashboardError,
  } = useGetWorkspacesWorkspaceIdDashboardMy(workspaceId, myDashboardParams, {
    query: {
      initialData: initialDashboard,
      retry: (failureCount: number, error: unknown) =>
        getApiErrorStatus(error) !== 403 && getApiErrorStatus(error) !== 404 && failureCount < 1,
    },
  });
  const dashboard = myDashboardResponse?.status === 200 ? myDashboardResponse.data : null;

  const activeScoreboard = dashboard?.activeScoreboard ?? null;
  const scoreboardId = toNumberId(activeScoreboard?.id);
  const weeklyLogsParams: GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyParams = {
    weekStart: selectedWeekStart,
  };
  const monthlyLogsParams: GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlyParams = {
    monthStart: selectedMonthStart,
  };
  const monthlySummaryParams: GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlySummaryParams =
    {
      monthStart: selectedMonthStart,
    };

  const weeklyLogsQueryKey =
    scoreboardId !== null
      ? getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyQueryKey(
          workspaceId,
          scoreboardId,
          weeklyLogsParams,
        )
      : null;
  const monthlyLogsQueryKey =
    scoreboardId !== null
      ? getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlyQueryKey(
          workspaceId,
          scoreboardId,
          monthlyLogsParams,
        )
      : null;
  const monthlySummaryQueryKey =
    scoreboardId !== null
      ? getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlySummaryQueryKey(
          workspaceId,
          scoreboardId,
          monthlySummaryParams,
        )
      : null;
  const dashboardTeamQueryKey = getGetWorkspacesWorkspaceIdDashboardTeamQueryKey(
    workspaceId,
    currentWeekDates.length === 7
      ? ({ weekStart: currentWeekDates[0] } satisfies GetWorkspacesWorkspaceIdDashboardTeamParams)
      : undefined,
  );
  const myDashboardQueryKey = getGetWorkspacesWorkspaceIdDashboardMyQueryKey(
    workspaceId,
    myDashboardParams,
  );

  const isWorkspace404 = getApiErrorStatus(dashboardError) === 404;
  const workspace = dashboard?.workspace ?? null;

  const weeklyLeadMeasures = dashboard?.weeklyLogs?.leadMeasures ?? [];
  const monthlySummary = dashboard?.monthlyLogs?.summary ?? dashboard?.monthlySummary?.summary;
  const monthLabel = dashboard?.monthlyLogs?.monthLabel ?? dashboard?.monthlySummary?.monthLabel;
  const periodEnd =
    selectedView === "month"
      ? (dashboard?.monthlyLogs?.monthEnd ?? dashboard?.monthlySummary?.monthEnd ?? weekDates[6])
      : weekDates[6];
  const activeLeadMeasures = (activeScoreboard?.leadMeasures ?? []).filter((leadMeasure) => {
    if (leadMeasure.status !== "ACTIVE") return false;
    if (!leadMeasure.createdAt) return true;
    const d = new Date(leadMeasure.createdAt);
    if (isNaN(d.getTime())) return leadMeasure.createdAt.split("T")[0] <= periodEnd;
    const kstMs = d.getTime() + 9 * 60 * 60 * 1000;
    const kstDate = new Date(kstMs);
    const createdAtDate = `${kstDate.getUTCFullYear()}-${String(kstDate.getUTCMonth() + 1).padStart(2, "0")}-${String(kstDate.getUTCDate()).padStart(2, "0")}`;
    return createdAtDate <= periodEnd;
  });
  const weeklyTargetMeasures = activeLeadMeasures.filter(
    (leadMeasure) => leadMeasure.period !== "MONTHLY",
  );
  const weeklyById = new Map(
    weeklyLeadMeasures.map((leadMeasure) => [toNumberId(leadMeasure.id), leadMeasure]),
  );

  const weeklyAchieved = weeklyTargetMeasures.reduce((accumulator, leadMeasure) => {
    const weekly = weeklyById.get(toNumberId(leadMeasure.id));
    const targetValue = leadMeasure.targetValue ?? 0;
    return accumulator + Math.min(weekly?.achieved ?? 0, targetValue);
  }, 0);
  const weeklyTotalTarget = weeklyTargetMeasures.reduce(
    (accumulator, leadMeasure) => accumulator + (leadMeasure.targetValue ?? 0),
    0,
  );
  const weeklyOverallRate =
    weeklyTotalTarget > 0 ? Math.round((weeklyAchieved / weeklyTotalTarget) * 100) : 0;
  const monthlyOverallRate = Math.round(monthlySummary?.achievementRate ?? 0);
  const monthlyLeadMeasures = dashboard?.monthlyLogs?.leadMeasures ?? [];
  const weekLabel =
    weekDates.length === 7
      ? `${weekDates[0].slice(5).replace("-", ".")} – ${weekDates[6].slice(5).replace("-", ".")}`
      : "";
  const weeklyTrendPoints: WeeklyTrendPoint[] = dashboard?.weeklyTrendPoints ?? [];
  const weeklyGuideById = new Map(
    weeklyLeadMeasures.map((leadMeasure) => [
      toNumberId(leadMeasure.id),
      leadMeasure.guide ?? null,
    ]),
  );

  const currentStreak = dashboard?.currentStreak ?? 0;
  const currentCheckinStreak = dashboard?.currentCheckinStreak ?? 0;

  return {
    activeLeadMeasures,
    activeScoreboard,
    currentStreak,
    currentCheckinStreak,
    dashboardTeamQueryKey,
    hasNoScoreboard: Boolean(dashboard) && !activeScoreboard,
    hasNoWorkspace: isWorkspace404,
    isLoading: isDashboardLoading && !isWorkspace404,
    isMonthlyLogsLoading: isDashboardLoading,
    isWeeklyLogsLoading: isDashboardLoading,
    isMonthlyLogsFetching: isDashboardFetching,
    isWeeklyLogsFetching: isDashboardFetching,
    isWeeklyTrendLoading: isDashboardLoading,
    monthLabel,
    monthlyLeadMeasures,
    monthlyLogsError: dashboardError,
    monthlyLogsQueryKey,
    monthlySummaryQueryKey,
    myDashboardQueryKey,
    monthlyOverallRate,
    monthlySummary,
    scoreboardError: dashboardError,
    scoreboardId,
    weeklyGuideById,
    weeklyById,
    weeklyLogsError: dashboardError,
    weeklyLogsQueryKey,
    weeklyOverallRate,
    weeklyTrendPoints,
    weekLabel,
    workspace,
    workspaceError: dashboardError,
  };
};
