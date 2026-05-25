"use client";

import {
  deleteLeadMeasuresLeadMeasureIdLogsDate,
  getGetScoreboardsScoreboardIdLogsWeeklyQueryKey,
  putLeadMeasuresLeadMeasureIdLogsDate,
  useDeleteLeadMeasuresLeadMeasureIdLogsDate,
  usePutLeadMeasuresLeadMeasureIdLogsDate,
} from "@/api/generated/daily-log/daily-log";
import {
  DailyLogValue,
  DashboardView,
  getNextLogValue,
  ToggleLogContext,
  WeeklyLogsQueryData,
  updateWeeklyLogsCache,
} from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { consumePushFollowupContext } from "@/lib/client/push-followup";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

type UseDashboardLogMutationParams = {
  scoreboardId: number | null;
  selectedView: DashboardView;
  showToast: (type: "success" | "error", message: string) => void;
  weeklyById: Map<number | null, { logs?: Record<string, DailyLogValue> }>;
  weeklyLogsQueryKey: ReturnType<
    typeof getGetScoreboardsScoreboardIdLogsWeeklyQueryKey
  > | null;
};

export const useDashboardLogMutation = ({
  scoreboardId,
  selectedView,
  showToast,
  weeklyById,
  weeklyLogsQueryKey,
}: UseDashboardLogMutationParams) => {
  const t = useTranslations("Dashboard.My");
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
    if (!context?.weeklyLogsQueryKey) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: context.weeklyLogsQueryKey,
    });
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

    showToast("error", getApiErrorMessage(error, t("logSaveFailed")));
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
        lead_measure_id_hash: hashId(leadMeasureId),
        log_date: date,
        scoreboard_id_hash: hashId(scoreboardId),
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
      lead_measure_id_hash: hashId(leadMeasureId),
      log_date: date,
      scoreboard_id_hash: hashId(scoreboardId),
      view_type: selectedView,
    });

    // 푸시 알림 클릭 후 24시간 내 첫 기록 전환 추적 (BigQuery 없이 GA4 Data API로 집계하기 위한 별도 이벤트)
    const pushContext = consumePushFollowupContext();
    if (pushContext) {
      trackEvent("push_followup_log_checked", {
        campaign_id: hashId(pushContext.campaignId),
        push_type: pushContext.pushType,
      });
    }
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
