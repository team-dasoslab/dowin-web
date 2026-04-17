"use client";

import {
  getGetDashboardTeamMemosQueryKey,
  useDeleteDashboardTeamMemosMemoId,
  useGetDashboardTeamMemos,
  usePatchDashboardTeamMemosMemoIdResolve,
  usePostDashboardTeamMemos,
} from "@/api/generated/dashboard/dashboard";
import { DashboardTeamMemo } from "@/api/generated/wig.schemas";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";

type UseTeamMemosParams = {
  targetUserId: number | null;
  enabled: boolean;
  currentUser: {
    id: number | null | undefined;
    nickname: string | null | undefined;
    avatarKey: string | null | undefined;
  };
};

type TeamMemosQueryData = {
  data: {
    workspaceId: number;
    targetUserId: number;
    memos: DashboardTeamMemo[];
  };
  status: 200;
  headers?: Headers;
};

const ensureMemoQueryData = (
  previous: TeamMemosQueryData | undefined,
  targetUserId: number,
): TeamMemosQueryData => {
  return (
    previous ?? {
      status: 200,
      data: {
        workspaceId: 0,
        targetUserId,
        memos: [],
      },
    }
  );
};

export const useTeamMemos = ({
  targetUserId,
  enabled,
  currentUser,
}: UseTeamMemosParams) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = getGetDashboardTeamMemosQueryKey(
    targetUserId !== null ? { targetUserId } : undefined,
  );

  const { data, error, isLoading, isFetching } = useGetDashboardTeamMemos(
    { targetUserId: targetUserId ?? 0 },
    {
      query: {
        enabled: enabled && targetUserId !== null,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, queryError) =>
          getApiErrorStatus(queryError) !== 404 && failureCount < 2,
      },
    },
  );

  const createMutation = usePostDashboardTeamMemos();
  const resolveMutation = usePatchDashboardTeamMemosMemoIdResolve();
  const deleteMutation = useDeleteDashboardTeamMemosMemoId();

  const invalidateMemos = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  const createMemo = async (content: string) => {
    if (targetUserId === null || currentUser.id == null) {
      return false;
    }

    const optimisticMemoId = -Date.now();
    const optimisticMemo: DashboardTeamMemo = {
      id: optimisticMemoId,
      workspaceId: 0,
      targetUserId,
      author: {
        userId: currentUser.id,
        nickname: currentUser.nickname ?? "나",
        avatarKey: currentUser.avatarKey ?? null,
      },
      content,
      isResolved: false,
      resolvedAt: null,
      resolvedByUserId: null,
      createdAt: new Date().toISOString(),
    };

    const previous = queryClient.getQueryData<TeamMemosQueryData>(queryKey);
    const next = ensureMemoQueryData(previous, targetUserId);

    queryClient.setQueryData<TeamMemosQueryData>(queryKey, {
      ...next,
      data: {
        ...next.data,
        memos: [optimisticMemo, ...next.data.memos],
      },
    });

    try {
      const response = await createMutation.mutateAsync({
        data: {
          targetUserId,
          content,
        },
      });

      if (response.status !== 201) {
        queryClient.setQueryData(queryKey, previous);
        showToast("error", "메모를 등록하지 못했습니다.");
        return false;
      }

      queryClient.setQueryData<TeamMemosQueryData>(queryKey, (current) => {
        const resolved = ensureMemoQueryData(current, targetUserId);

        return {
          ...resolved,
          data: {
            ...resolved.data,
            workspaceId: response.data.workspaceId,
            memos: resolved.data.memos.map((memo) =>
              memo.id === optimisticMemoId ? response.data : memo,
            ),
          },
        };
      });

      void invalidateMemos();
      return true;
    } catch (error) {
      queryClient.setQueryData(queryKey, previous);
      showToast("error", getApiErrorMessage(error, "메모를 등록하지 못했습니다."));
      return false;
    }
  };

  const resolveMemo = async (memoId: number, isResolved: boolean) => {
    if (targetUserId === null || currentUser.id == null || memoId <= 0) {
      return false;
    }

    const previous = queryClient.getQueryData<TeamMemosQueryData>(queryKey);

    queryClient.setQueryData<TeamMemosQueryData>(queryKey, (current) => {
      const resolved = ensureMemoQueryData(current, targetUserId);

      return {
        ...resolved,
        data: {
          ...resolved.data,
          memos: resolved.data.memos.map((memo) =>
            memo.id === memoId
              ? {
                  ...memo,
                  isResolved,
                  resolvedAt: isResolved ? new Date().toISOString() : null,
                  resolvedByUserId: isResolved ? currentUser.id : null,
                }
              : memo,
          ),
        },
      };
    });

    try {
      const response = await resolveMutation.mutateAsync({
        memoId,
        data: { isResolved },
      });

      if (response.status !== 200) {
        queryClient.setQueryData(queryKey, previous);
        showToast("error", "메모 상태를 변경하지 못했습니다.");
        return false;
      }

      queryClient.setQueryData<TeamMemosQueryData>(queryKey, (current) => {
        const resolved = ensureMemoQueryData(current, targetUserId);

        return {
          ...resolved,
          data: {
            ...resolved.data,
            memos: resolved.data.memos.map((memo) =>
              memo.id === memoId ? response.data : memo,
            ),
          },
        };
      });

      void invalidateMemos();
      return true;
    } catch (error) {
      queryClient.setQueryData(queryKey, previous);
      showToast(
        "error",
        getApiErrorMessage(error, "메모 상태를 변경하지 못했습니다."),
      );
      return false;
    }
  };

  const deleteMemo = async (memoId: number) => {
    if (targetUserId === null || memoId <= 0) {
      return false;
    }

    const previous = queryClient.getQueryData<TeamMemosQueryData>(queryKey);

    queryClient.setQueryData<TeamMemosQueryData>(queryKey, (current) => {
      const resolved = ensureMemoQueryData(current, targetUserId);

      return {
        ...resolved,
        data: {
          ...resolved.data,
          memos: resolved.data.memos.filter((memo) => memo.id !== memoId),
        },
      };
    });

    try {
      const response = await deleteMutation.mutateAsync({ memoId });

      if (response.status !== 204) {
        queryClient.setQueryData(queryKey, previous);
        showToast("error", "메모를 삭제하지 못했습니다.");
        return false;
      }

      void invalidateMemos();
      return true;
    } catch (error) {
      queryClient.setQueryData(queryKey, previous);
      showToast("error", getApiErrorMessage(error, "메모를 삭제하지 못했습니다."));
      return false;
    }
  };

  return {
    memos: data?.status === 200 ? data.data.memos ?? [] : [],
    isLoading,
    isFetching,
    isError: enabled && targetUserId !== null && error != null,
    isCreatePending: createMutation.isPending,
    isResolvePending: resolveMutation.isPending,
    isDeletePending: deleteMutation.isPending,
    createMemo,
    resolveMemo,
    deleteMemo,
  };
};
