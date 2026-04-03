"use client";

import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import { getGetUsersMeQueryKey } from "@/api/generated/profile/profile";
import {
  getGetWorkspacesIdMembersQueryKey,
  getGetWorkspacesMeQueryKey,
  usePostWorkspacesIdTransferAdmin,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UseTransferWorkspaceAdminParams = {
  workspaceId: number;
};

export const useTransferWorkspaceAdmin = ({
  workspaceId,
}: UseTransferWorkspaceAdminParams) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingTransferMemberId, setPendingTransferMemberId] = useState<
    number | null
  >(null);
  const transferAdminMutation = usePostWorkspacesIdTransferAdmin();

  const invalidateMemberQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetUsersMeQueryKey(),
      }),
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

  const transferAdmin = async (memberId: number, nickname: string) => {
    if (!confirm(`${nickname} 님에게 관리자 권한을 이전할까요?`)) {
      return;
    }

    try {
      setPendingTransferMemberId(memberId);
      const response = await transferAdminMutation.mutateAsync({
        id: workspaceId,
        data: {
          memberId,
        },
      });

      if (response.status !== 200) {
        throw response;
      }

      await invalidateMemberQueries();
      showToast("success", "관리자 권한을 이전했습니다.");
      router.replace("/profile");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "관리자 권한 이전에 실패했습니다."),
      );
    } finally {
      setPendingTransferMemberId(null);
    }
  };

  return {
    pendingTransferMemberId,
    transferAdmin,
  };
};
