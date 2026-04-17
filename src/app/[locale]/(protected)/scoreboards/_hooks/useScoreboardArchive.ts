"use client";

import {
  getGetScoreboardsActiveQueryKey,
  getGetScoreboardsQueryKey,
  useGetScoreboards,
  useGetScoreboardsActive,
  usePostScoreboardsIdArchive,
  usePostScoreboardsIdReactivate,
} from "@/api/generated/scoreboard/scoreboard";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  toNumberId,
} from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const useScoreboardArchive = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

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
    isLoading: isActiveScoreboardLoading,
    error: activeScoreboardError,
  } = useGetScoreboardsActive({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 1,
    },
  });
  const { data: archivedScoreboardsResponse, isLoading: isArchivedLoading } =
    useGetScoreboards();

  const archiveMutation = usePostScoreboardsIdArchive();
  const reactivateMutation = usePostScoreboardsIdReactivate();
  const hasNoWorkspace = getApiErrorStatus(workspaceError) === 404;
  const hasNoActiveScoreboard = getApiErrorStatus(activeScoreboardError) === 404;

  const workspace =
    hasNoWorkspace || workspaceResponse?.status !== 200
      ? null
      : workspaceResponse.data;
  const activeScoreboard =
    hasNoActiveScoreboard || activeScoreboardResponse?.status !== 200
      ? null
      : activeScoreboardResponse.data;
  const archivedScoreboards =
    archivedScoreboardsResponse?.status === 200
      ? archivedScoreboardsResponse.data ?? []
      : [];
  const isLoading =
    isWorkspaceLoading || isActiveScoreboardLoading || isArchivedLoading;

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetScoreboardsActiveQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetScoreboardsQueryKey(),
      }),
    ]);
  };

  const archive = async (id: number) => {
    setPendingActionId(id);

    try {
      await archiveMutation.mutateAsync({ id });
      await invalidateQueries();
      showToast("success", "점수판을 보관했습니다.");
      return true;
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "점수판 보관에 실패했습니다."),
      );
      return false;
    } finally {
      setPendingActionId(null);
    }
  };

  const reactivate = async (id: number) => {
    setPendingActionId(id);

    try {
      await reactivateMutation.mutateAsync({ id });
      await invalidateQueries();
      showToast("success", "점수판을 다시 활성화했습니다.");
      return true;
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "점수판 활성화에 실패했습니다."),
      );
      return false;
    } finally {
      setPendingActionId(null);
    }
  };

  return {
    activeScoreboard,
    archivedScoreboards,
    archive,
    hasNoActiveScoreboard,
    hasNoWorkspace,
    isLoading,
    pendingActionId,
    reactivate,
    workspace,
    activeScoreboardId: toNumberId(activeScoreboard?.id),
  };
};
