"use client";

import {
  getGetScoreboardsActiveQueryKey,
  getGetScoreboardsQueryKey,
  useGetScoreboardsActive,
  usePostScoreboards,
  usePostScoreboardsIdArchive,
  usePutScoreboardsId,
} from "@/api/generated/scoreboard/scoreboard";
import {
  getGetScoreboardsScoreboardIdLeadMeasuresQueryKey,
  useDeleteLeadMeasuresId,
  useGetScoreboardsScoreboardIdLeadMeasures,
  usePostScoreboardsScoreboardIdLeadMeasures,
  usePutLeadMeasuresId,
} from "@/api/generated/lead-measure/lead-measure";
import { useToast } from "@/context/ToastContext";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  toNumberId,
} from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { MeasureInput } from "@/app/(protected)/setup/_lib/measure";
import { createEmptyMeasure } from "@/app/(protected)/setup/_lib/measure";

export const useScoreboardSetup = () => {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const mode = searchParams.get("mode");

  const [goalName, setGoalName] = useState("");
  const [lagMeasure, setLagMeasure] = useState("");
  const [measures, setMeasures] = useState<MeasureInput[]>([]);
  const [activeTooltip, setActiveTooltip] = useState<"lag" | "lead" | null>(
    null,
  );

  const {
    data: activeScoreboardResponse,
    error: activeScoreboardError,
    isLoading: isActiveScoreboardLoading,
  } = useGetScoreboardsActive({
    query: {
      retry: false,
    },
  });

  const hasNoActiveScoreboard = getApiErrorStatus(activeScoreboardError) === 404;
  const activeScoreboard =
    hasNoActiveScoreboard || activeScoreboardResponse?.status !== 200
      ? null
      : activeScoreboardResponse.data;
  const scoreboardId = toNumberId(activeScoreboard?.id);
  const isEditMode = scoreboardId !== null && mode !== "create";

  const { data: leadMeasuresResponse, isLoading: isLeadMeasuresLoading } =
    useGetScoreboardsScoreboardIdLeadMeasures(scoreboardId ?? 0, undefined, {
      query: {
        enabled: scoreboardId !== null,
      },
    });

  const leadMeasures =
    leadMeasuresResponse?.status === 200 ? leadMeasuresResponse.data : [];

  const createScoreboardMutation = usePostScoreboards();
  const updateScoreboardMutation = usePutScoreboardsId();
  const archiveScoreboardMutation = usePostScoreboardsIdArchive();
  const createLeadMeasureMutation = usePostScoreboardsScoreboardIdLeadMeasures();
  const updateLeadMeasureMutation = usePutLeadMeasuresId();
  const deleteLeadMeasureMutation = useDeleteLeadMeasuresId();

  useEffect(() => {
    if (isEditMode && activeScoreboard && leadMeasuresResponse?.status === 200) {
      const nextLeadMeasures = leadMeasuresResponse.data ?? [];

      setGoalName(activeScoreboard.goalName ?? "");
      setLagMeasure(activeScoreboard.lagMeasure ?? "");
      setMeasures(
        nextLeadMeasures.map((leadMeasure) => ({
          id: String(leadMeasure.id ?? crypto.randomUUID()),
          existingId: toNumberId(leadMeasure.id),
          name: leadMeasure.name ?? "",
          period: leadMeasure.period === "MONTHLY" ? "MONTHLY" : "WEEKLY",
          targetValue: leadMeasure.targetValue ?? 1,
        })),
      );
      return;
    }

    if (!isEditMode) {
      setGoalName("");
      setLagMeasure("");
      setMeasures([createEmptyMeasure()]);
    }
  }, [activeScoreboard, isEditMode, leadMeasuresResponse]);

  const handleMeasureChange = (
    id: string,
    field: keyof MeasureInput,
    value: string | number | "WEEKLY" | "MONTHLY" | null,
  ) => {
    setMeasures((previous) =>
      previous.map((measure) =>
        measure.id === id ? { ...measure, [field]: value } : measure,
      ),
    );
  };

  const addMeasureRow = () => {
    setMeasures((previous) => [...previous, createEmptyMeasure()]);
  };

  const removeMeasureRow = (id: string) => {
    if (measures.length > 1) {
      setMeasures((previous) => previous.filter((measure) => measure.id !== id));
    }
  };

  const invalidateScoreboardQueries = async (targetScoreboardId: number | null) => {
    await queryClient.invalidateQueries({
      queryKey: getGetScoreboardsActiveQueryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: getGetScoreboardsQueryKey(),
    });

    if (targetScoreboardId !== null) {
      await queryClient.invalidateQueries({
        queryKey: getGetScoreboardsScoreboardIdLeadMeasuresQueryKey(
          targetScoreboardId,
          undefined,
        ),
      });
    }
  };

  const submit = async () => {
    const validMeasures = measures.filter((measure) => measure.name.trim() !== "");

    if (!goalName.trim() || !lagMeasure.trim() || validMeasures.length === 0) {
      showToast(
        "error",
        "가중목, 후행지표, 최소 1개의 선행지표를 입력해주세요.",
      );
      return false;
    }

    try {
      const startDate = new Date().toISOString().split("T")[0];

      if (!isEditMode) {
        const createdScoreboard = await createScoreboardMutation.mutateAsync({
          data: {
            goalName,
            lagMeasure,
            startDate,
          },
        });

        if (createdScoreboard.status !== 201) {
          throw new Error("점수판 생성에 실패했습니다.");
        }

        const createdScoreboardId = toNumberId(createdScoreboard.data.id);

        if (createdScoreboardId === null) {
          throw new Error("점수판 ID를 확인할 수 없습니다.");
        }

        for (const measure of validMeasures) {
          await createLeadMeasureMutation.mutateAsync({
            scoreboardId: createdScoreboardId,
            data: {
              name: measure.name,
              targetValue: measure.targetValue,
              period: measure.period,
            },
          });
        }

        await invalidateScoreboardQueries(createdScoreboardId);
        showToast("success", "새 점수판을 만들었습니다.");
        return true;
      }

      if (scoreboardId !== null) {
        await updateScoreboardMutation.mutateAsync({
          id: scoreboardId,
          data: {
            goalName,
            lagMeasure,
          },
        });

        const nextExistingIds = new Set<number>();

        for (const measure of validMeasures) {
          if (measure.existingId !== null) {
            nextExistingIds.add(measure.existingId);
            await updateLeadMeasureMutation.mutateAsync({
              id: measure.existingId,
              data: {
                name: measure.name,
                targetValue: measure.targetValue,
                period: measure.period,
              },
            });
            continue;
          }

          const createdLeadMeasure = await createLeadMeasureMutation.mutateAsync({
            scoreboardId,
            data: {
              name: measure.name,
              targetValue: measure.targetValue,
              period: measure.period,
            },
          });

          if (createdLeadMeasure.status !== 201) {
            throw new Error("선행지표 생성에 실패했습니다.");
          }

          const createdLeadMeasureId = toNumberId(createdLeadMeasure.data.id);

          if (createdLeadMeasureId !== null) {
            nextExistingIds.add(createdLeadMeasureId);
          }
        }

        for (const leadMeasure of leadMeasures) {
          const leadMeasureId = toNumberId(leadMeasure.id);

          if (leadMeasureId !== null && !nextExistingIds.has(leadMeasureId)) {
            await deleteLeadMeasureMutation.mutateAsync({ id: leadMeasureId });
          }
        }

        await invalidateScoreboardQueries(scoreboardId);
        showToast("success", "점수판을 저장했습니다.");
      }

      return true;
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "점수판 저장에 실패했습니다."),
      );
      return false;
    }
  };

  const archive = async () => {
    if (!scoreboardId) {
      return false;
    }

    try {
      await archiveScoreboardMutation.mutateAsync({
        id: scoreboardId,
      });
      await invalidateScoreboardQueries(scoreboardId);
      showToast(
        "success",
        "점수판을 보관했습니다. 새 점수판을 만들 수 있어요.",
      );
      return true;
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "점수판 보관에 실패했습니다."),
      );
      return false;
    }
  };

  return {
    activeTooltip,
    addMeasureRow,
    archive,
    goalName,
    handleMeasureChange,
    isInitializing:
      isActiveScoreboardLoading || (scoreboardId !== null && isLeadMeasuresLoading),
    isSubmitPending:
      createScoreboardMutation.isPending ||
      updateScoreboardMutation.isPending ||
      createLeadMeasureMutation.isPending ||
      updateLeadMeasureMutation.isPending ||
      deleteLeadMeasureMutation.isPending,
    isArchivePending: archiveScoreboardMutation.isPending,
    isEditMode,
    lagMeasure,
    measures,
    removeMeasureRow,
    setActiveTooltip,
    setGoalName,
    setLagMeasure,
    submit,
  };
};
