"use client";

import {
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasuresQueryKey,
  useDeleteWorkspacesWorkspaceIdLeadMeasuresId,
  useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures,
  usePostWorkspacesWorkspaceIdLeadMeasuresIdArchive,
  usePostWorkspacesWorkspaceIdLeadMeasuresIdReactivate,
  usePostWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures,
  usePutWorkspacesWorkspaceIdLeadMeasuresId,
} from "@/api/generated/lead-measure/lead-measure";
import {
  getGetWorkspacesWorkspaceIdScoreboardsActiveQueryKey,
  getGetWorkspacesWorkspaceIdScoreboardsQueryKey,
  useGetWorkspacesWorkspaceIdScoreboardsActive,
  usePostWorkspacesWorkspaceIdScoreboards,
  usePostWorkspacesWorkspaceIdScoreboardsIdArchive,
  usePutWorkspacesWorkspaceIdScoreboardsId,
} from "@/api/generated/scoreboard/scoreboard";
import {
  getGetWorkspacesIdTagsQueryKey,
  type GetWorkspacesIdTagsQueryResult,
  useDeleteWorkspacesIdTagsTagId,
  useGetWorkspacesIdTags,
  useGetWorkspacesMe,
  usePostWorkspacesIdTags,
  usePutWorkspacesIdTagsTagId,
} from "@/api/generated/workspace/workspace";
import type {
  MeasureInput,
  SetupTag,
} from "@/app/[locale]/(protected)/setup/_lib/measure";
import {
  clampMeasureTargetValue,
  createEmptyMeasure,
  getDaysInMonthFromIsoDate,
  MAX_MEASURE_TAGS,
  MAX_TAG_NAME_LENGTH,
  normalizeTagName,
} from "@/app/[locale]/(protected)/setup/_lib/measure";
import { useToast } from "@/context/ToastContext";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  toNumberId,
} from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { generateId } from "@/lib/utils";
import { useEffect, useState } from "react";

export const useScoreboardSetup = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const t = useTranslations("Setup.Toast");
  const setupT = useTranslations("Setup");
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
  const workspaceId = workspace?.id ?? "";
  const { data: workspaceTagsResponse, isLoading: isWorkspaceTagsLoading } =
    useGetWorkspacesIdTags(workspaceId, {
      query: {
        enabled: Boolean(workspaceId),
        retry: false,
      },
    });
  const availableTags: SetupTag[] =
    workspaceTagsResponse?.status === 200 ? workspaceTagsResponse.data : [];
  const workspaceTagsQueryKey =
    workspaceId ? getGetWorkspacesIdTagsQueryKey(workspaceId) : null;

  const {
    data: activeScoreboardResponse,
    error: activeScoreboardError,
    isLoading: isActiveScoreboardLoading,
  } = useGetWorkspacesWorkspaceIdScoreboardsActive(workspaceId, {
    query: {
      retry: false,
    },
  });

  const hasNoActiveScoreboard =
    getApiErrorStatus(activeScoreboardError) === 404;
  const activeScoreboard =
    hasNoActiveScoreboard || activeScoreboardResponse?.status !== 200
      ? null
      : activeScoreboardResponse.data;
  const scoreboardId = toNumberId(activeScoreboard?.id);
  const isEditMode = scoreboardId !== null && mode !== "create";
  const referenceStartDate =
    activeScoreboard?.startDate ?? new Date().toISOString().split("T")[0];
  const monthlyTargetMax = getDaysInMonthFromIsoDate(referenceStartDate);
  const isRedirecting =
    !isEditMode &&
    mode === "update" &&
    !isActiveScoreboardLoading &&
    hasNoActiveScoreboard;


  const { data: leadMeasuresResponse, isLoading: isLeadMeasuresLoading } =
    useGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures(workspaceId, scoreboardId ?? 0,
      isEditMode ? { status: "all" } : undefined,
      {
        query: {
          enabled: scoreboardId !== null,
        },
      },
    );
  const createScoreboardMutation = usePostWorkspacesWorkspaceIdScoreboards();
  const updateScoreboardMutation = usePutWorkspacesWorkspaceIdScoreboardsId();
  const archiveScoreboardMutation = usePostWorkspacesWorkspaceIdScoreboardsIdArchive();
  const createLeadMeasureMutation =
    usePostWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasures();
  const updateLeadMeasureMutation = usePutWorkspacesWorkspaceIdLeadMeasuresId();
  const archiveLeadMeasureMutation = usePostWorkspacesWorkspaceIdLeadMeasuresIdArchive();
  const reactivateLeadMeasureMutation = usePostWorkspacesWorkspaceIdLeadMeasuresIdReactivate();
  const deleteLeadMeasureMutation = useDeleteWorkspacesWorkspaceIdLeadMeasuresId();
  const createWorkspaceTagMutation = usePostWorkspacesIdTags();
  const updateWorkspaceTagMutation = usePutWorkspacesIdTagsTagId();
  const deleteWorkspaceTagMutation = useDeleteWorkspacesIdTagsTagId();

  useEffect(() => {
    if (!isEditMode && mode === "update" && !isActiveScoreboardLoading && hasNoActiveScoreboard) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("mode", "create");
      router.replace(currentUrl.pathname + currentUrl.search);
    }
  }, [isEditMode, mode, isActiveScoreboardLoading, hasNoActiveScoreboard, router]);

  useEffect(() => {
    if (
      isEditMode &&
      activeScoreboard &&
      leadMeasuresResponse?.status === 200
    ) {
      const nextLeadMeasures = leadMeasuresResponse.data ?? [];

      setGoalName(activeScoreboard.goalName ?? "");
      setLagMeasure(activeScoreboard.lagMeasure ?? "");
      setMeasures(
        nextLeadMeasures.map((leadMeasure: any) => ({
          id: String(leadMeasure.id ?? generateId()),
          existingId: toNumberId(leadMeasure.id),
          initialStatus: leadMeasure.status ?? "ACTIVE",
          status: leadMeasure.status ?? "ACTIVE",
          name: leadMeasure.name ?? "",
          period: leadMeasure.period === "MONTHLY" ? "MONTHLY" : "WEEKLY",
          targetValue: clampMeasureTargetValue(
            leadMeasure.targetValue ?? 1,
            leadMeasure.period === "MONTHLY" ? "MONTHLY" : "WEEKLY",
            monthlyTargetMax,
          ),
          tags:
            leadMeasure.tags?.map((tag: any) => ({
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

        if (field === "period" && (value === "WEEKLY" || value === "MONTHLY")) {
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
    const targetMeasure = measures.find((measure) => measure.id === id);
    if (!targetMeasure) return;

    const isExisting = targetMeasure.existingId !== null;
    const activeMeasuresCount = measures.filter(
      (measure) => measure.status === "ACTIVE" && !measure.isDeleted,
    ).length;

    if (targetMeasure.status === "ACTIVE" && !isExisting && activeMeasuresCount <= 1) {
      return;
    }

    if (isExisting) {
      setMeasures((previous) =>
        previous.map((measure) =>
          measure.id === id ? { ...measure, isDeleted: true } : measure,
        ),
      );
      return;
    }

    setMeasures((previous) =>
      previous.filter((measure) => measure.id !== id),
    );
  };

  const restoreMeasureRow = (id: string) => {
    setMeasures((previous) =>
      previous.map((measure) =>
        measure.id === id ? { ...measure, isDeleted: false } : measure,
      ),
    );
  };

  const archiveMeasureRow = (id: string) => {
    setMeasures((previous) =>
      previous.map((measure) =>
        measure.id === id && measure.existingId !== null
          ? { ...measure, status: "ARCHIVED" }
          : measure,
      ),
    );
  };

  const reactivateMeasureRow = (id: string) => {
    setMeasures((previous) =>
      previous.map((measure) =>
        measure.id === id ? { ...measure, status: "ACTIVE" } : measure,
      ),
    );
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
      showToast("info", t("tagLimitReached", { n: MAX_MEASURE_TAGS }));
    }
  };

  const createTag = async (measureId: string, rawName: string) => {
    const nextName = rawName.trim().replace(/\s+/g, " ");
    const normalizedName = normalizeTagName(rawName);

    if (!nextName) {
      showToast("info", t("enterTagName"));
      return false;
    }

    if (nextName.length > MAX_TAG_NAME_LENGTH) {
      showToast("info", t("tagNameTooLong", { n: MAX_TAG_NAME_LENGTH }));
      return false;
    }

    const existingTag = availableTags.find(
      (tag: any) => normalizeTagName(tag.name) === normalizedName,
    );

    const currentMeasure = measures.find((measure) => measure.id === measureId);
    if ((currentMeasure?.tags.length ?? 0) >= MAX_MEASURE_TAGS) {
      showToast("info", t("tagLimitReached", { n: MAX_MEASURE_TAGS }));
      return false;
    }

    if (existingTag) {
      const isAlreadySelected = currentMeasure?.tags.some(
        (tag: any) => tag.id === existingTag.id,
      );

      if (isAlreadySelected) {
        showToast("info", t("tagAlreadySelected"));
        return false;
      }

      toggleMeasureTag(measureId, existingTag);
      return true;
    }

    if (!workspaceId) {
      showToast("error", t("workspaceInfoNotFound"));
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
        throw new Error(t("tagCreateFailed"));
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
            tags: measure.tags.map((tag: any) =>
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
            tags: measure.tags.filter((tag: any) => tag.id !== optimisticTag.id),
          };
        }),
      );
      showToast("error", getApiErrorMessage(error, t("tagCreateFailed")));
      return false;
    }
  };

  const renameTag = async (tagId: number, rawName: string) => {
    const nextName = rawName.trim().replace(/\s+/g, " ");
    const normalizedName = normalizeTagName(rawName);

    if (!nextName) {
      showToast("info", t("enterTagName"));
      return false;
    }

    if (nextName.length > MAX_TAG_NAME_LENGTH) {
      showToast("info", t("tagNameTooLong", { n: MAX_TAG_NAME_LENGTH }));
      return false;
    }

    const duplicatedTag = availableTags.find(
      (tag: any) =>
        tag.id !== tagId && normalizeTagName(tag.name) === normalizedName,
    );

    if (duplicatedTag) {
      showToast("info", t("duplicatedTag"));
      return false;
    }

    if (!workspaceId) {
      showToast("error", t("workspaceInfoNotFound"));
      return false;
    }

    const previousName =
      availableTags.find((tag: any) => tag.id === tagId)?.name ?? nextName;
    const previousTagsResponse = workspaceTagsQueryKey
      ? queryClient.getQueryData<GetWorkspacesIdTagsQueryResult>(
          workspaceTagsQueryKey,
        )
      : undefined;

    setMeasures((previous) =>
      previous.map((measure) => ({
        ...measure,
        tags: measure.tags.map((tag: any) =>
          tag.id === tagId ? { ...tag, name: nextName } : tag,
        ),
      })),
    );
    if (workspaceTagsQueryKey) {
      queryClient.setQueryData<GetWorkspacesIdTagsQueryResult>(
        workspaceTagsQueryKey,
        (previous) => {
          if (!previous || previous.status !== 200) {
            return previous;
          }

          return {
            ...previous,
            data: previous.data.map((tag: any) =>
              tag.id === tagId ? { ...tag, name: nextName } : tag,
            ),
          };
        },
      );
    }

    try {
      await updateWorkspaceTagMutation.mutateAsync({
        id: workspaceId,
        tagId,
        data: {
          name: nextName,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: getGetWorkspacesIdTagsQueryKey(workspaceId),
      });

      return true;
    } catch (error) {
      setMeasures((previous) =>
        previous.map((measure) => ({
          ...measure,
          tags: measure.tags.map((tag: any) =>
            tag.id === tagId ? { ...tag, name: previousName } : tag,
          ),
        })),
      );
      if (workspaceTagsQueryKey && previousTagsResponse) {
        queryClient.setQueryData(workspaceTagsQueryKey, previousTagsResponse);
      }
      showToast("error", getApiErrorMessage(error, t("tagUpdateFailed")));
      return false;
    }
  };

  const deleteTag = async (tagId: number) => {
    if (!workspaceId) {
      showToast("error", t("workspaceInfoNotFound"));
      return false;
    }

    const previousMeasures = measures;
    const previousTagsResponse = workspaceTagsQueryKey
      ? queryClient.getQueryData<GetWorkspacesIdTagsQueryResult>(
          workspaceTagsQueryKey,
        )
      : undefined;
    setMeasures((previous) =>
      previous.map((measure) => ({
        ...measure,
        tags: measure.tags.filter((tag: any) => tag.id !== tagId),
      })),
    );
    if (workspaceTagsQueryKey) {
      queryClient.setQueryData<GetWorkspacesIdTagsQueryResult>(
        workspaceTagsQueryKey,
        (previous) => {
          if (!previous || previous.status !== 200) {
            return previous;
          }

          return {
            ...previous,
            data: previous.data.filter((tag: any) => tag.id !== tagId),
          };
        },
      );
    }

    try {
      await deleteWorkspaceTagMutation.mutateAsync({
        id: workspaceId,
        tagId,
      });

      await queryClient.invalidateQueries({
        queryKey: getGetWorkspacesIdTagsQueryKey(workspaceId),
      });

      return true;
    } catch (error) {
      setMeasures(previousMeasures);
      if (workspaceTagsQueryKey && previousTagsResponse) {
        queryClient.setQueryData(workspaceTagsQueryKey, previousTagsResponse);
      }
      showToast("error", getApiErrorMessage(error, t("tagDeleteFailed")));
      return false;
    }
  };

  const invalidateScoreboardQueries = async (
    targetScoreboardId: number | null,
  ) => {
    await queryClient.invalidateQueries({
      queryKey: getGetWorkspacesWorkspaceIdScoreboardsActiveQueryKey(workspaceId),
    });
    await queryClient.invalidateQueries({
      queryKey: getGetWorkspacesWorkspaceIdScoreboardsQueryKey(workspaceId),
    });

    if (targetScoreboardId !== null) {
      await queryClient.invalidateQueries({
        queryKey: getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasuresQueryKey(workspaceId, targetScoreboardId,
          undefined,
        ),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLeadMeasuresQueryKey(workspaceId, targetScoreboardId,
          { status: "all" },
        ),
      });
    }
  };

  const submit = async () => {
    const activeMeasures = measures.filter(
      (measure) => measure.status === "ACTIVE" && !measure.isDeleted,
    );
    const validMeasures = activeMeasures.filter(
      (measure) => measure.name.trim() !== "",
    );

    if (!goalName.trim() || !lagMeasure.trim() || validMeasures.length === 0) {
      showToast("error", t("fillRequiredFields"));
      return false;
    }

    const deletedExistingMeasures = measures.filter(
      (measure) => measure.existingId !== null && measure.isDeleted,
    );

    if (deletedExistingMeasures.length > 0) {
      const deletedNames = deletedExistingMeasures
        .map((m) => `- ${m.name || setupT("unnamedArchivedMeasure")}`)
        .join("\n");
      const confirmMsg = `${setupT("deleteConfirmTitle")}\n${deletedNames}\n\n${setupT("deleteConfirmWarning")}`;
      if (!window.confirm(confirmMsg)) {
        return false;
      }
    }

    try {
      const startDate = new Date().toISOString().split("T")[0];

      if (!isEditMode) {
        const createdScoreboard = await createScoreboardMutation.mutateAsync({ workspaceId,
          data: {
            goalName,
            lagMeasure,
            startDate,
          },
        });

        if (createdScoreboard.status !== 201) {
          throw new Error(t("createFailed"));
        }

        const createdScoreboardId = toNumberId(createdScoreboard.data.id);

        if (createdScoreboardId === null) {
          throw new Error(t("scoreboardIdNotFound"));
        }

        const createdMeasureIds: number[] = [];
        for (const measure of validMeasures) {
          const result = await createLeadMeasureMutation.mutateAsync({ workspaceId,
            scoreboardId: createdScoreboardId,
            data: {
              name: measure.name,
              targetValue: measure.targetValue,
              period: measure.period,
              tagIds: measure.tags.map((tag: any) => tag.id),
            },
          });
          if (result.status === 201) {
            createdMeasureIds.push(toNumberId(result.data.id) ?? 0);
          }
        }

        await invalidateScoreboardQueries(createdScoreboardId);
        trackEvent("scoreboard_created", {
          lead_measure_count: validMeasures.length,
          workspace_id_hash: workspaceId,
        });

        validMeasures.forEach((measure, index) => {
          trackEvent("lead_measure_created", {
            lead_measure_id_hash: hashId(createdMeasureIds[index]),
            period_type: measure.period,
            scoreboard_id_hash: hashId(createdScoreboardId),
          });
        });

        showToast("success", t("createSuccess"));
        router.refresh();
        return true;
      }

      if (scoreboardId !== null) {
        await updateScoreboardMutation.mutateAsync({ workspaceId,
          id: scoreboardId,
          data: {
            goalName,
            lagMeasure,
          },
        });

        const nextExistingIds = new Set<number>();

        for (const measure of validMeasures) {
          if (measure.existingId !== null) {
            if (measure.initialStatus === "ARCHIVED") {
              await reactivateLeadMeasureMutation.mutateAsync({ workspaceId,
                id: measure.existingId,
              });
            }

            nextExistingIds.add(measure.existingId);
            await updateLeadMeasureMutation.mutateAsync({ workspaceId,
              id: measure.existingId,
              data: {
                name: measure.name,
                targetValue: measure.targetValue,
                period: measure.period,
                tagIds: measure.tags.map((tag: any) => tag.id),
              },
            });
            continue;
          }

          const createdLeadMeasure =
            await createLeadMeasureMutation.mutateAsync({ workspaceId,
              scoreboardId,
              data: {
                name: measure.name,
                targetValue: measure.targetValue,
                period: measure.period,
                tagIds: measure.tags.map((tag: any) => tag.id),
              },
            });

          if (createdLeadMeasure.status !== 201) {
            throw new Error(t("leadMeasureCreateFailed"));
          }

          const createdLeadMeasureId = toNumberId(createdLeadMeasure.data.id);

          if (createdLeadMeasureId !== null) {
            nextExistingIds.add(createdLeadMeasureId);
            trackEvent("lead_measure_created", {
              lead_measure_id_hash: hashId(createdLeadMeasureId),
              period_type: measure.period,
              scoreboard_id_hash: hashId(scoreboardId),
            });
          }
        }

        for (const measure of measures) {
          if (
            measure.existingId !== null &&
            measure.initialStatus === "ACTIVE" &&
            measure.status === "ARCHIVED" &&
            !nextExistingIds.has(measure.existingId)
          ) {
            await archiveLeadMeasureMutation.mutateAsync({ workspaceId,
              id: measure.existingId,
            });
          }
        }

        for (const deletedMeasure of deletedExistingMeasures) {
          if (deletedMeasure.existingId !== null) {
            await deleteLeadMeasureMutation.mutateAsync({ workspaceId,
              id: deletedMeasure.existingId,
            });
          }
        }

        await invalidateScoreboardQueries(scoreboardId);
        showToast("success", t("saveSuccess"));
        router.refresh();
      }

      return true;
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("saveFailed")));
      return false;
    }
  };

  const archive = async () => {
    if (!scoreboardId) {
      return false;
    }

    try {
      await archiveScoreboardMutation.mutateAsync({ workspaceId,
        id: scoreboardId,
      });
      await invalidateScoreboardQueries(scoreboardId);
      showToast("success", t("archiveSuccess"));
      router.refresh();
      return true;
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("archiveFailed")));
      return false;
    }
  };

  return {
    activeTooltip,
    addMeasureRow,
    availableTags,
    archive,
    archiveMeasureRow,
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
      archiveLeadMeasureMutation.isPending ||
      reactivateLeadMeasureMutation.isPending ||
      deleteLeadMeasureMutation.isPending,
    isTagMutationPending:
      createWorkspaceTagMutation.isPending ||
      updateWorkspaceTagMutation.isPending ||
      deleteWorkspaceTagMutation.isPending,
    isArchivePending: archiveScoreboardMutation.isPending,
    isEditMode,
    isRedirecting,
    lagMeasure,
    measures,

    monthlyTargetMax,
    renameTag,
    reactivateMeasureRow,
    removeMeasureRow,
    restoreMeasureRow,
    setActiveTooltip,
    setGoalName,
    setLagMeasure,
    submit,
    deleteTag,
    toggleMeasureTag,
  };
};
