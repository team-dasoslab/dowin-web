"use client";

import {
  deleteLeadMeasuresLeadMeasureIdLogsDate,
  getGetScoreboardsScoreboardIdLogsMonthlyQueryKey,
  getGetScoreboardsScoreboardIdLogsWeeklyQueryKey,
  putLeadMeasuresLeadMeasureIdLogsDate,
  useDeleteLeadMeasuresLeadMeasureIdLogsDate,
  usePutLeadMeasuresLeadMeasureIdLogsDate,
} from "@/api/generated/daily-log/daily-log";
import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import { getGetScoreboardsActiveQueryKey } from "@/api/generated/scoreboard/scoreboard";
import {
  DailyLogValue,
  DashboardView,
  getNextLogValue,
  ToggleLogContext,
  WeeklyLogsQueryData,
  updateWeeklyLogsCache,
} from "@/app/(protected)/dashboard/my/_lib/dashboard-scoreboard";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type UseDashboardLogMutationParams = {
  dashboardTeamQueryKey: ReturnType<typeof getGetDashboardTeamQueryKey>;
  monthlyLogsQueryKey: ReturnType<
    typeof getGetScoreboardsScoreboardIdLogsMonthlyQueryKey
  > | null;
  scoreboardId: number | null;
  selectedView: DashboardView;
  showToast: (type: "success" | "error", message: string) => void;
  weeklyById: Map<number | null, { logs?: Record<string, DailyLogValue> }>;
  weeklyLogsQueryKey: ReturnType<
    typeof getGetScoreboardsScoreboardIdLogsWeeklyQueryKey
  > | null;
};

export const useDashboardLogMutation = ({
  dashboardTeamQueryKey,
  monthlyLogsQueryKey,
  scoreboardId,
  selectedView,
  showToast,
  weeklyById,
  weeklyLogsQueryKey,
}: UseDashboardLogMutationParams) => {
  const queryClient = useQueryClient();
  const [pendingLogKeys, setPendingLogKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const addPendingLogKey = (currentLogKey: string) => {
    setPendingLogKeys((previous) => {
      const next = new Set(previous);
      next.add(currentLogKey);
      return next;
    });
  };

  const removePendingLogKey = (currentLogKey: string) => {
    setPendingLogKeys((previous) => {
      const next = new Set(previous);
      next.delete(currentLogKey);
      return next;
    });
  };

  const invalidateToggleQueries = async (context?: ToggleLogContext) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetScoreboardsActiveQueryKey(),
      }),
      context?.weeklyLogsQueryKey
        ? queryClient.invalidateQueries({
            queryKey: context.weeklyLogsQueryKey,
          })
        : Promise.resolve(),
      context?.monthlyLogsQueryKey
        ? queryClient.invalidateQueries({
            queryKey: context.monthlyLogsQueryKey,
          })
        : Promise.resolve(),
      queryClient.invalidateQueries({
        queryKey: context?.dashboardTeamQueryKey ?? dashboardTeamQueryKey,
      }),
    ]);
  };

  const createToggleLogContext = (
    leadMeasureId: number,
    date: string,
    value: DailyLogValue,
  ): ToggleLogContext => {
    const currentLogKey = `${leadMeasureId}:${date}`;
    const previousWeeklyLogs =
      weeklyLogsQueryKey === null
        ? undefined
        : queryClient.getQueryData<WeeklyLogsQueryData>(weeklyLogsQueryKey);

    addPendingLogKey(currentLogKey);

    if (weeklyLogsQueryKey !== null) {
      queryClient.setQueryData<WeeklyLogsQueryData>(
        weeklyLogsQueryKey,
        updateWeeklyLogsCache(previousWeeklyLogs, leadMeasureId, date, value),
      );
    }

    return {
      currentLogKey,
      dashboardTeamQueryKey,
      monthlyLogsQueryKey,
      previousWeeklyLogs,
      weeklyLogsQueryKey,
    };
  };

  const handleToggleLogError = (error: unknown, context?: ToggleLogContext) => {
    if (context?.weeklyLogsQueryKey !== null && context !== undefined) {
      queryClient.setQueryData(
        context.weeklyLogsQueryKey,
        context.previousWeeklyLogs,
      );
    }

    showToast("error", getApiErrorMessage(error, "기록 저장에 실패했습니다."));
  };

  const handleToggleLogSettled = async (context?: ToggleLogContext) => {
    await invalidateToggleQueries(context);

    if (context) {
      removePendingLogKey(context.currentLogKey);
    }
  };

  const updateLogMutation = usePutLeadMeasuresLeadMeasureIdLogsDate<
    unknown,
    ToggleLogContext
  >({
    mutation: {
      mutationFn: async ({ leadMeasureId, date, data }) => {
        const response = await putLeadMeasuresLeadMeasureIdLogsDate(
          leadMeasureId,
          date,
          data,
        );

        if (response.status >= 400) {
          throw response;
        }

        return response;
      },
      onMutate: async ({ leadMeasureId, date, data }) => {
        await queryClient.cancelQueries({
          queryKey: weeklyLogsQueryKey ?? undefined,
        });

        return createToggleLogContext(leadMeasureId, date, data.value);
      },
      onError: (error, _variables, context) => {
        handleToggleLogError(error, context);
      },
      onSettled: async (_data, _error, _variables, context) => {
        await handleToggleLogSettled(context);
      },
    },
  });

  const deleteLogMutation = useDeleteLeadMeasuresLeadMeasureIdLogsDate<
    unknown,
    ToggleLogContext
  >({
    mutation: {
      mutationFn: async ({ leadMeasureId, date }) => {
        const response = await deleteLeadMeasuresLeadMeasureIdLogsDate(
          leadMeasureId,
          date,
        );

        if (response.status >= 400) {
          throw response;
        }

        return response;
      },
      onMutate: async ({ leadMeasureId, date }) => {
        await queryClient.cancelQueries({
          queryKey: weeklyLogsQueryKey ?? undefined,
        });

        return createToggleLogContext(leadMeasureId, date, null);
      },
      onError: (error, _variables, context) => {
        handleToggleLogError(error, context);
      },
      onSettled: async (_data, _error, _variables, context) => {
        await handleToggleLogSettled(context);
      },
    },
  });

  const toggleLog = async (leadMeasureId: number, date: string) => {
    if (scoreboardId === null) {
      return;
    }

    const currentValue = weeklyById.get(leadMeasureId)?.logs?.[date] ?? null;
    const nextValue = getNextLogValue(currentValue);
    const currentLogKey = `${leadMeasureId}:${date}`;

    if (pendingLogKeys.has(currentLogKey)) {
      return;
    }

    if (nextValue === null) {
      await deleteLogMutation.mutateAsync({
        leadMeasureId,
        date,
      });
      trackEvent("daily_log_checked", {
        checked_value: "undone",
        log_date: date,
        view_type: selectedView,
      });
      return;
    }

    await updateLogMutation.mutateAsync({
      data: { value: nextValue },
      date,
      leadMeasureId,
    });
    trackEvent("daily_log_checked", {
      checked_value: "done",
      log_date: date,
      view_type: selectedView,
    });
  };

  return {
    isLogPending:
      pendingLogKeys.size > 0 ||
      updateLogMutation.isPending ||
      deleteLogMutation.isPending,
    pendingLogKeys,
    toggleLog,
  };
};
