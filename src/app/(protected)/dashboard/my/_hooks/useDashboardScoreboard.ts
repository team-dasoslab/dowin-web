"use client";

import {
  deleteLeadMeasuresLeadMeasureIdLogsDateResponse,
  getGetScoreboardsScoreboardIdLogsMonthlyQueryKey,
  getGetScoreboardsScoreboardIdLogsWeeklyQueryKey,
  getScoreboardsScoreboardIdLogsWeeklyResponse200,
  putLeadMeasuresLeadMeasureIdLogsDateResponse,
  useDeleteLeadMeasuresLeadMeasureIdLogsDate,
  useGetScoreboardsScoreboardIdLogsMonthly,
  useGetScoreboardsScoreboardIdLogsWeekly,
  usePutLeadMeasuresLeadMeasureIdLogsDate,
} from "@/api/generated/daily-log/daily-log";
import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import {
  getGetScoreboardsActiveQueryKey,
  useGetScoreboardsActive,
} from "@/api/generated/scoreboard/scoreboard";
import { GetDashboardTeamParams } from "@/api/generated/wig.schemas";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import {
  getTodayInKst,
  getWeekDates,
} from "@/app/(protected)/dashboard/my/_lib/week";
import { useToast } from "@/context/ToastContext";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  toNumberId,
} from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type WeeklyLogsQueryData =
  | getScoreboardsScoreboardIdLogsWeeklyResponse200
  | undefined;
type DailyLogValue = boolean | null;

const getNextLogValue = (value: DailyLogValue): DailyLogValue => {
  return value === true ? null : true;
};

const updateWeeklyLogsCache = (
  previous: WeeklyLogsQueryData,
  leadMeasureId: number,
  date: string,
  value: DailyLogValue,
): WeeklyLogsQueryData => {
  if (!previous || previous.status !== 200) {
    return previous;
  }

  return {
    ...previous,
    data: {
      ...previous.data,
      leadMeasures: previous.data.leadMeasures?.map((leadMeasure) => {
        if (toNumberId(leadMeasure.id) !== leadMeasureId) {
          return leadMeasure;
        }

        const nextLogs = {
          ...(leadMeasure.logs ?? {}),
          [date]: value,
        };
        const achieved = Object.values(nextLogs).filter(Boolean).length;
        const targetValue = leadMeasure.targetValue ?? 0;
        const achievementRate =
          targetValue > 0
            ? Math.round((achieved / targetValue) * 1000) / 10
            : 0;

        return {
          ...leadMeasure,
          logs: nextLogs,
          achieved,
          achievementRate,
        };
      }),
    },
  };
};

export const useDashboardScoreboard = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [pendingLogKey, setPendingLogKey] = useState<string | null>(null);
  const weekDates = getWeekDates();
  const today = getTodayInKst();

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
  const weeklyLogsQueryKey =
    scoreboardId !== null
      ? getGetScoreboardsScoreboardIdLogsWeeklyQueryKey(scoreboardId, undefined)
      : null;
  const monthlyLogsQueryKey =
    scoreboardId !== null
      ? getGetScoreboardsScoreboardIdLogsMonthlyQueryKey(
          scoreboardId,
          undefined,
        )
      : null;
  const dashboardTeamQueryKey = getGetDashboardTeamQueryKey(
    weekDates.length === 7
      ? ({ weekStart: weekDates[0] } satisfies GetDashboardTeamParams)
      : undefined,
  );

  const { data: weeklyLogsResponse, isLoading: isWeeklyLogsLoading } =
    useGetScoreboardsScoreboardIdLogsWeekly(scoreboardId ?? 0, undefined, {
      query: {
        enabled: scoreboardId !== null,
      },
    });
  const { data: monthlyLogsResponse, isLoading: isMonthlyLogsLoading } =
    useGetScoreboardsScoreboardIdLogsMonthly(scoreboardId ?? 0, undefined, {
      query: {
        enabled: scoreboardId !== null,
      },
    });

  const updateLogMutation = usePutLeadMeasuresLeadMeasureIdLogsDate();
  const deleteLogMutation = useDeleteLeadMeasuresLeadMeasureIdLogsDate();

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

  const weeklyTotalRate = weeklyTargetMeasures.reduce(
    (accumulator, leadMeasure) => {
      const weekly = weeklyById.get(toNumberId(leadMeasure.id));
      return accumulator + (weekly?.achievementRate ?? 0);
    },
    0,
  );
  const weeklyOverallRate =
    weeklyTargetMeasures.length > 0
      ? Math.round(weeklyTotalRate / weeklyTargetMeasures.length)
      : 0;
  const monthlyOverallRate = Math.round(monthlySummary?.achievementRate ?? 0);
  const weekLabel =
    weekDates.length === 7
      ? `${weekDates[0].slice(5).replace("-", ".")} – ${weekDates[6].slice(5).replace("-", ".")}`
      : "";

  const toggleLog = async (leadMeasureId: number, date: string) => {
    if (scoreboardId === null || pendingLogKey) {
      return;
    }

    const currentValue = weeklyById.get(leadMeasureId)?.logs?.[date] ?? null;
    const nextValue = getNextLogValue(currentValue);
    const currentLogKey = `${leadMeasureId}:${date}`;

    setPendingLogKey(currentLogKey);

    const previousWeeklyLogs =
      weeklyLogsQueryKey === null
        ? undefined
        : queryClient.getQueryData<WeeklyLogsQueryData>(weeklyLogsQueryKey);

    if (weeklyLogsQueryKey !== null) {
      queryClient.setQueryData<WeeklyLogsQueryData>(
        weeklyLogsQueryKey,
        updateWeeklyLogsCache(
          previousWeeklyLogs,
          leadMeasureId,
          date,
          nextValue,
        ),
      );
    }

    try {
      const response:
        | putLeadMeasuresLeadMeasureIdLogsDateResponse
        | deleteLeadMeasuresLeadMeasureIdLogsDateResponse =
        nextValue === null
          ? await deleteLogMutation.mutateAsync({
              leadMeasureId,
              date,
            })
          : await updateLogMutation.mutateAsync({
              leadMeasureId,
              date,
              data: { value: nextValue },
            });

      if (response.status >= 400) {
        throw response;
      }
    } catch (error) {
      if (weeklyLogsQueryKey !== null) {
        queryClient.setQueryData(weeklyLogsQueryKey, previousWeeklyLogs);
      }

      showToast(
        "error",
        getApiErrorMessage(error, "기록 저장에 실패했습니다."),
      );
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetScoreboardsActiveQueryKey(),
        }),
        weeklyLogsQueryKey !== null
          ? queryClient.invalidateQueries({
              queryKey: weeklyLogsQueryKey,
            })
          : Promise.resolve(),
        monthlyLogsQueryKey !== null
          ? queryClient.invalidateQueries({
              queryKey: monthlyLogsQueryKey,
            })
          : Promise.resolve(),
        queryClient.invalidateQueries({
          queryKey: dashboardTeamQueryKey,
        }),
      ]);

      setPendingLogKey((value) => (value === currentLogKey ? null : value));
    }
  };

  return {
    activeLeadMeasures,
    activeScoreboard,
    hasNoScoreboard: isScoreboard404 || !activeScoreboard,
    hasNoWorkspace: isWorkspace404,
    isLoading: (isWorkspaceLoading || isScoreboardLoading) && !isWorkspace404,
    isLogPending:
      pendingLogKey !== null ||
      updateLogMutation.isPending ||
      deleteLogMutation.isPending,
    isMonthlyLogsLoading,
    isWeeklyLogsLoading,
    monthlyOverallRate,
    pendingLogKey,
    scoreboardError,
    today,
    toggleLog,
    monthLabel,
    weekDates,
    weekLabel,
    weeklyOverallRate,
    weeklyById,
    workspace,
    workspaceError,
  };
};
