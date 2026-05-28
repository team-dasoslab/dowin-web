"use client";

import {
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlyQueryKey,
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyQueryKey,
  getWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeekly,
  useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthly,
  useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeekly,
} from "@/api/generated/daily-log/daily-log";
import { getGetWorkspacesWorkspaceIdDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import { useGetWorkspacesWorkspaceIdScoreboardsActive } from "@/api/generated/scoreboard/scoreboard";
import {
  GetWorkspacesWorkspaceIdDashboardTeamParams,
  GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlyParams,
  GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyParams,
} from "@/api/generated/dowin.schemas";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import {
  computeWeeklyRate,
  type WeeklyTrendPoint,
} from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { addDays } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { getApiErrorStatus, toNumberId } from "@/lib/client/frontend-api";
import { useQueries } from "@tanstack/react-query";

type UseDashboardScoreboardQueriesParams = {
  workspaceId: string;
  currentWeekDates: string[];
  selectedMonthStart: string;
  selectedView: "week" | "month";
  selectedWeekStart: string;
  weekDates: string[];
};

export const useDashboardScoreboardQueries = ({
  workspaceId,
  currentWeekDates,
  selectedMonthStart,
  selectedView,
  selectedWeekStart,
  weekDates,
}: UseDashboardScoreboardQueriesParams) => {
  const {
    data: workspaceResponse,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
  } = useGetWorkspacesMe({
    query: {
      retry: (failureCount: number, error: unknown) =>
        getApiErrorStatus(error) !== 404 && failureCount < 3,
    },
  });

  const {
    data: activeScoreboardResponse,
    isLoading: isScoreboardLoading,
    error: scoreboardError,
  } = useGetWorkspacesWorkspaceIdScoreboardsActive(workspaceId, {
    query: {
      retry: (failureCount: number, error: unknown) =>
        getApiErrorStatus(error) !== 404 && failureCount < 1,
    },
  });

  const activeScoreboard =
    activeScoreboardResponse?.status === 200
      ? activeScoreboardResponse.data
      : null;
  const scoreboardId = toNumberId(activeScoreboard?.id);
  const weeklyLogsParams: GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyParams = {
    weekStart: selectedWeekStart,
  };
  const monthlyLogsParams: GetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlyParams = {
    monthStart: selectedMonthStart,
  };
  const trendWeekStarts = [-21, -14, -7, 0].map((offset) =>
    addDays(selectedWeekStart, offset),
  );

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
  const dashboardTeamQueryKey = getGetWorkspacesWorkspaceIdDashboardTeamQueryKey(
    workspaceId,
    currentWeekDates.length === 7
      ? ({ weekStart: currentWeekDates[0] } satisfies GetWorkspacesWorkspaceIdDashboardTeamParams)
      : undefined,
  );

  const {
    data: weeklyLogsResponse,
    isLoading: isWeeklyLogsLoading,
    isFetching: isWeeklyLogsFetching,
    error: weeklyLogsError,
  } = useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeekly(workspaceId, scoreboardId ?? 0,
    weeklyLogsParams,
    {
      query: {
        enabled: scoreboardId !== null && selectedView === "week",
        retry: (failureCount: number, error: unknown) =>
          getApiErrorStatus(error) !== 403 && failureCount < 1,
      },
    },
  );
  const {
    data: monthlyLogsResponse,
    isLoading: isMonthlyLogsLoading,
    isFetching: isMonthlyLogsFetching,
    error: monthlyLogsError,
  } = useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthly(workspaceId, scoreboardId ?? 0,
    monthlyLogsParams,
    {
      query: {
        enabled: scoreboardId !== null && selectedView === "month",
        retry: (failureCount: number, error: unknown) =>
          getApiErrorStatus(error) !== 403 && failureCount < 1,
      },
    },
  );
  const weeklyTrendQueries = useQueries({
    queries: trendWeekStarts.map((weekStart) => ({
      enabled: scoreboardId !== null,
      queryFn: () =>
        getWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeekly(workspaceId, scoreboardId ?? 0, {
          weekStart,
        }),
      queryKey:
        scoreboardId !== null
          ? getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyQueryKey(workspaceId, scoreboardId, {
            weekStart,
          })
          : ["dashboard", "weekly-trend", weekStart],
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const isWorkspace404 = getApiErrorStatus(workspaceError) === 404;
  const isScoreboard404 = getApiErrorStatus(scoreboardError) === 404;
  const workspace =
    workspaceResponse?.status === 200 ? workspaceResponse.data : null;

  const weeklyLeadMeasures =
    weeklyLogsResponse?.status === 200
      ? (weeklyLogsResponse.data.leadMeasures ?? [])
      : [];
  const monthlySummary =
    monthlyLogsResponse?.status === 200
      ? monthlyLogsResponse.data.summary
      : undefined;
  const monthLabel =
    monthlyLogsResponse?.status === 200
      ? monthlyLogsResponse.data.monthLabel
      : undefined;
  const activeLeadMeasures = (activeScoreboard?.leadMeasures ?? []).filter(
    (leadMeasure: { status?: string }) => leadMeasure.status === "ACTIVE",
  );
  const weeklyTargetMeasures = activeLeadMeasures.filter(
    (leadMeasure: { period?: string }) => leadMeasure.period !== "MONTHLY",
  );
  const weeklyById = new Map(
    weeklyLeadMeasures.map((leadMeasure: { id?: number | string }) => [
      toNumberId(leadMeasure.id),
      leadMeasure,
    ]),
  );

  const weeklyAchieved = weeklyTargetMeasures.reduce(
    (accumulator: number, leadMeasure: { id?: number | string; targetValue?: number | null }) => {
      const weekly = weeklyById.get(toNumberId(leadMeasure.id));
      const targetValue = leadMeasure.targetValue ?? 0;
      return accumulator + Math.min(weekly?.achieved ?? 0, targetValue);
    },
    0,
  );
  const weeklyTotalTarget = weeklyTargetMeasures.reduce(
    (accumulator: number, leadMeasure: { targetValue?: number | null }) => accumulator + (leadMeasure.targetValue ?? 0),
    0,
  );
  const weeklyOverallRate =
    weeklyTotalTarget > 0
      ? Math.round((weeklyAchieved / weeklyTotalTarget) * 100)
      : 0;
  const monthlyOverallRate = Math.round(monthlySummary?.achievementRate ?? 0);
  const monthlyLeadMeasures =
    monthlyLogsResponse?.status === 200
      ? (monthlyLogsResponse.data.leadMeasures ?? [])
      : [];
  const weekLabel =
    weekDates.length === 7
      ? `${weekDates[0].slice(5).replace("-", ".")} – ${weekDates[6].slice(5).replace("-", ".")}`
      : "";
  const weeklyTrendPoints: WeeklyTrendPoint[] = trendWeekStarts.map(
    (weekStart, index) => {
      const response = weeklyTrendQueries[index]?.data;
      const weeklyLeadMeasuresForTrend =
        response?.status === 200 ? (response.data.leadMeasures ?? []) : [];
      const rate = computeWeeklyRate(
        activeLeadMeasures,
        weeklyLeadMeasuresForTrend,
      );

      return {
        label: weekStart.slice(5).replace("-", "."),
        rate,
        weekStart,
      };
    },
  );
  const weeklyGuideById = new Map(
    weeklyLeadMeasures.map((leadMeasure: { id?: number | string; guide?: string | null }) => [
      toNumberId(leadMeasure.id),
      leadMeasure.guide ?? null,
    ]),
  );

  return {
    activeLeadMeasures,
    activeScoreboard,
    dashboardTeamQueryKey,
    hasNoScoreboard: isScoreboard404 || !activeScoreboard,
    hasNoWorkspace: isWorkspace404,
    isLoading: (isWorkspaceLoading || isScoreboardLoading) && !isWorkspace404,
    isMonthlyLogsLoading,
    isWeeklyLogsLoading,
    isMonthlyLogsFetching,
    isWeeklyLogsFetching,
    isWeeklyTrendLoading: weeklyTrendQueries.some((query) => query.isLoading),
    monthLabel,
    monthlyLeadMeasures,
    monthlyLogsError,
    monthlyLogsQueryKey,
    monthlyOverallRate,
    monthlySummary,
    scoreboardError,
    scoreboardId,
    weeklyGuideById,
    weeklyById,
    weeklyLogsError,
    weeklyLogsQueryKey,
    weeklyOverallRate,
    weeklyTrendPoints,
    weekLabel,
    workspace,
    workspaceError,
  };
};
