"use client";

import {
  getGetWorkspacesIdInvitesQueryKey,
  usePatchWorkspacesIdInvitesInviteIdStatus,
  usePostWorkspacesIdInvites,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type UseInviteActionsParams = {
  workspaceId: number;
};

export const useInviteActions = ({
  workspaceId,
}: UseInviteActionsParams) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [copiedInviteId, setCopiedInviteId] = useState<number | null>(null);
  const [pendingToggleInviteId, setPendingToggleInviteId] = useState<
    number | null
  >(null);

  const createInviteMutation = usePostWorkspacesIdInvites();
  const updateInviteStatusMutation =
    usePatchWorkspacesIdInvitesInviteIdStatus();

  const invalidateInviteQueries = async () => {
    await queryClient.invalidateQueries({
      queryKey: getGetWorkspacesIdInvitesQueryKey(workspaceId),
    });
  };

  const createInvite = async (maxUses: number) => {
    try {
      const response = await createInviteMutation.mutateAsync({
        id: workspaceId,
        data: { maxUses },
      });

      if (response.status !== 201) {
        throw response;
      }

      await invalidateInviteQueries();
      showToast("success", "초대코드를 생성했습니다.");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "초대코드 생성에 실패했습니다."),
      );
    }
  };

  const toggleInviteStatus = async (
    inviteId: number,
    nextStatus: "ACTIVE" | "INACTIVE",
  ) => {
    try {
      setPendingToggleInviteId(inviteId);
      const response = await updateInviteStatusMutation.mutateAsync({
        id: workspaceId,
        inviteId,
        data: { status: nextStatus },
      });

      if (response.status !== 200) {
        throw response;
      }

      await invalidateInviteQueries();
      showToast(
        "success",
        nextStatus === "ACTIVE"
          ? "초대코드를 활성화했습니다."
          : "초대코드를 비활성화했습니다.",
      );
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "초대코드 상태 변경에 실패했습니다."),
      );
    } finally {
      setPendingToggleInviteId(null);
    }
  };

  const copyInviteCode = async (inviteId: number, code?: string) => {
    if (!code) {
      showToast("error", "복사할 코드가 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopiedInviteId(inviteId);
      showToast("success", "초대코드를 복사했습니다.");
      setTimeout(() => {
        setCopiedInviteId((current) => (current === inviteId ? null : current));
      }, 1200);
    } catch {
      showToast("error", "클립보드 복사에 실패했습니다.");
    }
  };

  return {
    copiedInviteId,
    createInvite,
    copyInviteCode,
    isCreatingInvite: createInviteMutation.isPending,
    pendingToggleInviteId,
    toggleInviteStatus,
  };
};
