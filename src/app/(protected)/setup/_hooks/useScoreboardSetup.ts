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
import {
  getGetWorkspacesIdTagsQueryKey,
  useGetWorkspacesIdTags,
  useGetWorkspacesMe,
  usePostWorkspacesIdTags,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  toNumberId,
} from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  MeasureInput,
  SetupTag,
} from "@/app/(protected)/setup/_lib/measure";
import {
  clampMeasureTargetValue,
  createEmptyMeasure,
  getDaysInMonthFromIsoDate,
  MAX_MEASURE_TAGS,
  MAX_TAG_NAME_LENGTH,
  normalizeTagName,
} from "@/app/(protected)/setup/_lib/measure";

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
  const { data: workspaceResponse, isLoading: isWorkspaceLoading } =
    useGetWorkspacesMe({
      query: {
        retry: false,
      },
    });
  const workspace =
    workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const workspaceId = toNumberId(workspace?.id);
  const { data: workspaceTagsResponse, isLoading: isWorkspaceTagsLoading } =
    useGetWorkspacesIdTags(workspaceId ?? 0, {
      query: {
        enabled: workspaceId !== null,
        retry: false,
      },
    });
  const availableTags: SetupTag[] =
    workspaceTagsResponse?.status === 200 ? workspaceTagsResponse.data : [];

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
  const referenceStartDate =
    activeScoreboard?.startDate ?? new Date().toISOString().split("T")[0];
  const monthlyTargetMax = getDaysInMonthFromIsoDate(referenceStartDate);

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
  const createWorkspaceTagMutation = usePostWorkspacesIdTags();

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
          targetValue: clampMeasureTargetValue(
            leadMeasure.targetValue ?? 1,
            leadMeasure.period === "MONTHLY" ? "MONTHLY" : "WEEKLY",
            monthlyTargetMax,
          ),
          tags:
            leadMeasure.tags?.map((tag) => ({
              id: tag.id,
              name: tag.name,
            })) ?? [],
        })),
      );
      return;
    }

    if (!isEditMode) {
      setGoalName("");
      setLagMeasure("");
      setMeasures([createEmptyMeasure()]);
    }
  }, [activeScoreboard, isEditMode, leadMeasuresResponse, monthlyTargetMax]);

  const handleMeasureChange = (
    id: string,
    field: keyof MeasureInput,
    value: string | number | "WEEKLY" | "MONTHLY" | null,
  ) => {
    setMeasures((previous) =>
      previous.map((measure) => {
        if (measure.id !== id) {
          return measure;
        }

        if (
          field === "period" &&
          (value === "WEEKLY" || value === "MONTHLY")
        ) {
          return {
            ...measure,
            period: value,
            targetValue: clampMeasureTargetValue(
              measure.targetValue,
              value,
              monthlyTargetMax,
            ),
          };
        }

        if (field === "targetValue" && typeof value === "number") {
          return {
            ...measure,
            targetValue: clampMeasureTargetValue(
              value,
              measure.period,
              monthlyTargetMax,
            ),
          };
        }

        return { ...measure, [field]: value };
      }),
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

  const toggleMeasureTag = (measureId: string, tag: SetupTag) => {
    let limitReached = false;

    setMeasures((previous) =>
      previous.map((measure) => {
        if (measure.id !== measureId) {
          return measure;
        }

        const hasTag = measure.tags.some((item) => item.id === tag.id);

        if (hasTag) {
          return {
            ...measure,
            tags: measure.tags.filter((item) => item.id !== tag.id),
          };
        }

        if (measure.tags.length >= MAX_MEASURE_TAGS) {
          limitReached = true;
          return measure;
        }

        return {
          ...measure,
          tags: [...measure.tags, tag],
        };
      }),
    );

    if (limitReached) {
      showToast("info", `태그는 최대 ${MAX_MEASURE_TAGS}개까지 선택할 수 있어요.`);
    }
  };

  const createTag = async (measureId: string, rawName: string) => {
    const nextName = rawName.trim().replace(/\s+/g, " ");
    const normalizedName = normalizeTagName(rawName);

    if (!nextName) {
      showToast("info", "태그 이름을 입력해주세요.");
      return false;
    }

    if (nextName.length > MAX_TAG_NAME_LENGTH) {
      showToast("info", `태그 이름은 ${MAX_TAG_NAME_LENGTH}자 이하여야 해요.`);
      return false;
    }

    const existingTag = availableTags.find(
      (tag) => normalizeTagName(tag.name) === normalizedName,
    );

    if (existingTag) {
      toggleMeasureTag(measureId, existingTag);
      return true;
    }

    const currentMeasure = measures.find((measure) => measure.id === measureId);
    if ((currentMeasure?.tags.length ?? 0) >= MAX_MEASURE_TAGS) {
      showToast("info", `태그는 최대 ${MAX_MEASURE_TAGS}개까지 선택할 수 있어요.`);
      return false;
    }

    if (workspaceId === null) {
      showToast("error", "워크스페이스 정보를 확인할 수 없습니다.");
      return false;
    }

    const optimisticTag: SetupTag = {
      id: -Date.now(),
      name: nextName,
    };

    setMeasures((previous) =>
      previous.map((measure) => {
        if (measure.id !== measureId) {
          return measure;
        }

        return {
          ...measure,
          tags: [...measure.tags, optimisticTag],
        };
      }),
    );

    try {
      const createdTagResponse = await createWorkspaceTagMutation.mutateAsync({
        id: workspaceId,
        data: {
          name: nextName,
        },
      });

      if (createdTagResponse.status !== 201) {
        throw new Error("태그 생성에 실패했습니다.");
      }

      const createdTag: SetupTag = {
        id: createdTagResponse.data.id,
        name: createdTagResponse.data.name,
      };

      setMeasures((previous) =>
        previous.map((measure) => {
          if (measure.id !== measureId) {
            return measure;
          }

          return {
            ...measure,
            tags: measure.tags.map((tag) =>
              tag.id === optimisticTag.id ? createdTag : tag,
            ),
          };
        }),
      );

      await queryClient.invalidateQueries({
        queryKey: getGetWorkspacesIdTagsQueryKey(workspaceId),
      });

      return true;
    } catch (error) {
      setMeasures((previous) =>
        previous.map((measure) => {
          if (measure.id !== measureId) {
            return measure;
          }

          return {
            ...measure,
            tags: measure.tags.filter((tag) => tag.id !== optimisticTag.id),
          };
        }),
      );
      showToast("error", getApiErrorMessage(error, "태그 생성에 실패했습니다."));
      return false;
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
              tagIds: measure.tags.map((tag) => tag.id),
            },
          });
        }

        await invalidateScoreboardQueries(createdScoreboardId);
        trackEvent("scoreboard_created", {
          lead_measure_count: validMeasures.length,
        });
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
                tagIds: measure.tags.map((tag) => tag.id),
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
              tagIds: measure.tags.map((tag) => tag.id),
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
    availableTags,
    archive,
    createTag,
    goalName,
    handleMeasureChange,
    isInitializing:
      isWorkspaceLoading ||
      (workspaceId !== null && isWorkspaceTagsLoading) ||
      isActiveScoreboardLoading ||
      (scoreboardId !== null && isLeadMeasuresLoading),
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
    monthlyTargetMax,
    removeMeasureRow,
    setActiveTooltip,
    setGoalName,
    setLagMeasure,
    submit,
    toggleMeasureTag,
  };
};
