"use client";


import { getGetUsersMeQueryKey } from "@/api/generated/profile/profile";
import {
  getGetWorkspacesIdMembersQueryKey,
  getGetWorkspacesMeQueryKey,
  usePostWorkspacesIdTransferAdmin,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

type UseTransferWorkspaceAdminParams = {
  workspaceId: string;
};

export const useTransferWorkspaceAdmin = ({
  workspaceId,
}: UseTransferWorkspaceAdminParams) => {
  const t = useTranslations("Profile");
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
        predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/dashboard/team'),
      }),
    ]);
  };

  const transferAdmin = async (memberId: number, nickname: string) => {
    if (!confirm(t("confirmTransferAdmin", { nickname }))) {
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
      showToast("success", t("adminTransferred"));
      router.replace("/profile");
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("adminTransferFailed")));
    } finally {
      setPendingTransferMemberId(null);
    }
  };

  return {
    pendingTransferMemberId,
    transferAdmin,
  };
};
