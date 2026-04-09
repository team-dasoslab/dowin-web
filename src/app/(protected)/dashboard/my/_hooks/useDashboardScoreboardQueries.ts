"use client";

import {
  getScoreboardsScoreboardIdLogsWeekly,
  getGetScoreboardsScoreboardIdLogsMonthlyQueryKey,
  getGetScoreboardsScoreboardIdLogsWeeklyQueryKey,
  useGetScoreboardsScoreboardIdLogsMonthly,
  useGetScoreboardsScoreboardIdLogsWeekly,
} from "@/api/generated/daily-log/daily-log";
import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import { useGetScoreboardsActive } from "@/api/generated/scoreboard/scoreboard";
import {
  GetDashboardTeamParams,
  GetScoreboardsScoreboardIdLogsMonthlyParams,
  GetScoreboardsScoreboardIdLogsWeeklyParams,
} from "@/api/generated/wig.schemas";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import {
  computeWeeklyRate,
  type WeeklyTrendPoint,
} from "@/app/(protected)/dashboard/my/_lib/dashboard-scoreboard";
import { addDays } from "@/app/(protected)/dashboard/my/_lib/week";
import { getApiErrorStatus, toNumberId } from "@/lib/client/frontend-api";
import { useQueries } from "@tanstack/react-query";

type UseDashboardScoreboardQueriesParams = {
  currentWeekDates: string[];
  selectedMonthStart: string;
  selectedWeekStart: string;
  weekDates: string[];
};

export const useDashboardScoreboardQueries = ({
  currentWeekDates,
  selectedMonthStart,
  selectedWeekStart,
  weekDates,
}: UseDashboardScoreboardQueriesParams) => {
  const {
    data: workspaceResponse,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
  } = useGetWorkspacesMe({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 3,
    },
  });

  const {
    data: activeScoreboardResponse,
    isLoading: isScoreboardLoading,
    error: scoreboardError,
  } = useGetScoreboardsActive({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 1,
    },
  });

  const activeScoreboard =
    activeScoreboardResponse?.status === 200
      ? activeScoreboardResponse.data
      : null;
  const scoreboardId = toNumberId(activeScoreboard?.id);
  const weeklyLogsParams: GetScoreboardsScoreboardIdLogsWeeklyParams = {
    weekStart: selectedWeekStart,
  };
  const monthlyLogsParams: GetScoreboardsScoreboardIdLogsMonthlyParams = {
    monthStart: selectedMonthStart,
  };
  const trendWeekStarts = [-21, -14, -7, 0].map((offset) =>
    addDays(selectedWeekStart, offset),
  );

  const weeklyLogsQueryKey =
    scoreboardId !== null
      ? getGetScoreboardsScoreboardIdLogsWeeklyQueryKey(
          scoreboardId,
          weeklyLogsParams,
        )
      : null;
  const monthlyLogsQueryKey =
    scoreboardId !== null
      ? getGetScoreboardsScoreboardIdLogsMonthlyQueryKey(
          scoreboardId,
          monthlyLogsParams,
        )
      : null;
  const dashboardTeamQueryKey = getGetDashboardTeamQueryKey(
    currentWeekDates.length === 7
      ? ({ weekStart: currentWeekDates[0] } satisfies GetDashboardTeamParams)
      : undefined,
  );

  const { data: weeklyLogsResponse, isLoading: isWeeklyLogsLoading } =
    useGetScoreboardsScoreboardIdLogsWeekly(scoreboardId ?? 0, weeklyLogsParams, {
      query: {
        enabled: scoreboardId !== null,
      },
    });
  const { data: monthlyLogsResponse, isLoading: isMonthlyLogsLoading } =
    useGetScoreboardsScoreboardIdLogsMonthly(scoreboardId ?? 0, monthlyLogsParams, {
      query: {
        enabled: scoreboardId !== null,
      },
    });
  const weeklyTrendQueries = useQueries({
    queries: trendWeekStarts.map((weekStart) => ({
      enabled: scoreboardId !== null,
      queryFn: () =>
        getScoreboardsScoreboardIdLogsWeekly(scoreboardId ?? 0, {
          weekStart,
        }),
      queryKey:
        scoreboardId !== null
          ? getGetScoreboardsScoreboardIdLogsWeeklyQueryKey(scoreboardId, {
              weekStart,
            })
          : ["dashboard", "weekly-trend", weekStart],
      staleTime: 60_000,
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
    (leadMeasure) => leadMeasure.status === "ACTIVE",
  );
  const weeklyTargetMeasures = activeLeadMeasures.filter(
    (leadMeasure) => leadMeasure.period !== "MONTHLY",
  );
  const weeklyById = new Map(
    weeklyLeadMeasures.map((leadMeasure) => [
      toNumberId(leadMeasure.id),
      leadMeasure,
    ]),
  );

  const weeklyAchieved = weeklyTargetMeasures.reduce(
    (accumulator, leadMeasure) => {
      const weekly = weeklyById.get(toNumberId(leadMeasure.id));
      const targetValue = leadMeasure.targetValue ?? 0;
      return accumulator + Math.min(weekly?.achieved ?? 0, targetValue);
    },
    0,
  );
  const weeklyTotalTarget = weeklyTargetMeasures.reduce(
    (accumulator, leadMeasure) => accumulator + (leadMeasure.targetValue ?? 0),
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
    weeklyLeadMeasures.map((leadMeasure) => [toNumberId(leadMeasure.id), leadMeasure.guide ?? null]),
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
    isWeeklyTrendLoading: weeklyTrendQueries.some((query) => query.isLoading),
    monthLabel,
    monthlyLeadMeasures,
    monthlyLogsQueryKey,
    monthlyOverallRate,
    monthlySummary,
    scoreboardError,
    scoreboardId,
    weeklyGuideById,
    weeklyById,
    weeklyLogsQueryKey,
    weeklyOverallRate,
    weeklyTrendPoints,
    weekLabel,
    workspace,
    workspaceError,
  };
};
