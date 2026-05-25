"use client";


import {
  getGetWorkspacesIdMembersQueryKey,
  getGetWorkspacesMeQueryKey,
  useDeleteWorkspacesIdMembersMemberId,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

type UseRemoveWorkspaceMemberParams = {
  workspaceId: number;
};

export const useRemoveWorkspaceMember = ({
  workspaceId,
}: UseRemoveWorkspaceMemberParams) => {
  const t = useTranslations("Profile");
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
        predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/dashboard/team'),
      }),
    ]);
  };

  const removeMember = async (memberId: number, nickname: string) => {
    if (!confirm(t("confirmRemoveMember", { nickname }))) {
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
      showToast("success", t("memberRemoved"));
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("memberRemoveFailed")));
    } finally {
      setPendingDeleteMemberId(null);
    }
  };

  return {
    pendingDeleteMemberId,
    removeMember,
  };
};
