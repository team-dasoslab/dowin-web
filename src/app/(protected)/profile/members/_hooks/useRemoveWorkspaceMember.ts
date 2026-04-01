"use client";

import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import {
  getGetWorkspacesIdMembersQueryKey,
  getGetWorkspacesMeQueryKey,
  useDeleteWorkspacesIdMembersMemberId,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type UseRemoveWorkspaceMemberParams = {
  workspaceId: number;
};

export const useRemoveWorkspaceMember = ({
  workspaceId,
}: UseRemoveWorkspaceMemberParams) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [pendingDeleteMemberId, setPendingDeleteMemberId] = useState<
    number | null
  >(null);
  const deleteMemberMutation = useDeleteWorkspacesIdMembersMemberId();

  const invalidateMemberQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetWorkspacesMeQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetWorkspacesIdMembersQueryKey(workspaceId),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetDashboardTeamQueryKey(undefined),
      }),
    ]);
  };

  const removeMember = async (memberId: number, nickname: string) => {
    if (!confirm(`${nickname} 님을 워크스페이스에서 퇴출할까요?`)) {
      return;
    }

    try {
      setPendingDeleteMemberId(memberId);
      const response = await deleteMemberMutation.mutateAsync({
        id: workspaceId,
        memberId,
      });

      if (response.status !== 204) {
        throw response;
      }

      await invalidateMemberQueries();
      showToast("success", "멤버를 퇴출했습니다.");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "멤버 퇴출에 실패했습니다."),
      );
    } finally {
      setPendingDeleteMemberId(null);
    }
  };

  return {
    pendingDeleteMemberId,
    removeMember,
  };
};
