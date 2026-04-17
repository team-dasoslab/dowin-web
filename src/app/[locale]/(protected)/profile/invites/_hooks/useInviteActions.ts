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

import { useTranslations } from "next-intl";

export const useInviteActions = ({ workspaceId }: UseInviteActionsParams) => {
  const t = useTranslations("ProfileInvites");
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
      showToast("success", t("createSuccess"));
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("createFailed")));
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
        nextStatus === "ACTIVE" ? t("activeSuccess") : t("inactiveSuccess"),
      );
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("statusChangeFailed")));
    } finally {
      setPendingToggleInviteId(null);
    }
  };

  const copyInviteCode = async (inviteId: number, code?: string) => {
    if (!code) {
      showToast("error", t("noCodeToCopy"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopiedInviteId(inviteId);
      showToast("success", t("copySuccess"));
      setTimeout(() => {
        setCopiedInviteId((current) => (current === inviteId ? null : current));
      }, 1200);
    } catch {
      showToast("error", t("copyFailed"));
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
