"use client";

import { getGetScoreboardsScoreboardIdLogsWeeklyQueryKey, useGetScoreboardsScoreboardIdLogsWeekly } from "@/api/generated/daily-log/daily-log";
import { useGetScoreboardsActive } from "@/api/generated/scoreboard/scoreboard";
import {
  getGetScoreboardsScoreboardIdLeadMeasuresQueryKey,
  useDeleteLeadMeasuresId,
  useGetScoreboardsScoreboardIdLeadMeasures,
  usePostLeadMeasuresIdArchive,
} from "@/api/generated/lead-measure/lead-measure";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage, toNumberId } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { getWeekDates } from "@/app/(protected)/dashboard/my/_lib/week";

export const useScoreboardMeasureDetail = (rawMeasureId: string) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const measureId = toNumberId(rawMeasureId);

  const { data: activeScoreboardResponse } = useGetScoreboardsActive({
    query: {
      retry: false,
    },
  });

  const activeScoreboard =
    activeScoreboardResponse?.status === 200 ? activeScoreboardResponse.data : null;
  const scoreboardId = toNumberId(activeScoreboard?.id);
  const weekDates = getWeekDates();

  const {
    data: leadMeasuresResponse,
    isLoading: isLeadMeasuresLoading,
    error: leadMeasuresError,
  } = useGetScoreboardsScoreboardIdLeadMeasures(scoreboardId ?? 0, undefined, {
    query: {
      enabled: scoreboardId !== null,
    },
  });

  const {
    data: weeklyLogsResponse,
    isLoading: isWeeklyLogsLoading,
    error: weeklyLogsError,
  } = useGetScoreboardsScoreboardIdLogsWeekly(scoreboardId ?? 0, undefined, {
    query: {
      enabled: scoreboardId !== null,
    },
  });

  const archiveLeadMeasureMutation = usePostLeadMeasuresIdArchive();
  const deleteLeadMeasureMutation = useDeleteLeadMeasuresId();

  const measure =
    leadMeasuresResponse?.status === 200
      ? (leadMeasuresResponse.data ?? []).find(
          (leadMeasure) => toNumberId(leadMeasure.id) === measureId,
        )
      : null;

  const weeklyMeasure =
    weeklyLogsResponse?.status === 200
      ? (weeklyLogsResponse.data.leadMeasures ?? []).find(
          (leadMeasure) => toNumberId(leadMeasure.id) === measureId,
        )
      : null;

  const chartData = weekDates.map((date, index) => ({
    date,
    label: `${index + 1}일차`,
    dayLabel: ["월", "화", "수", "목", "금", "토", "일"][index] ?? "",
    value: weeklyMeasure?.logs?.[date] ?? null,
  }));

  const invalidateLeadMeasures = async () => {
    if (scoreboardId !== null) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetScoreboardsScoreboardIdLeadMeasuresQueryKey(
            scoreboardId,
            undefined,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetScoreboardsScoreboardIdLogsWeeklyQueryKey(
            scoreboardId,
            undefined,
          ),
        }),
      ]);
    }
  };

  const archive = async () => {
    if (measureId === null) {
      return false;
    }

    try {
      await archiveLeadMeasureMutation.mutateAsync({ id: measureId });
      await invalidateLeadMeasures();
      showToast("success", "지표를 보관했습니다.");
      return true;
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "지표 보관에 실패했습니다."),
      );
      return false;
    }
  };

  const remove = async () => {
    if (measureId === null) {
      return false;
    }

    try {
      await deleteLeadMeasureMutation.mutateAsync({ id: measureId });
      await invalidateLeadMeasures();
      showToast("success", "지표를 삭제했습니다.");
      return true;
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "지표 삭제에 실패했습니다."),
      );
      return false;
    }
  };

  return {
    chartData,
    hasActiveScoreboard: scoreboardId !== null,
    isDeleting: deleteLeadMeasureMutation.isPending,
    isArchiving: archiveLeadMeasureMutation.isPending,
    isLoading:
      scoreboardId === null
        ? false
        : isLeadMeasuresLoading || isWeeklyLogsLoading,
    leadMeasuresError,
    measure,
    measureId,
    remove,
    archive,
    weeklyLogsError,
    weeklyMeasure,
  };
};
