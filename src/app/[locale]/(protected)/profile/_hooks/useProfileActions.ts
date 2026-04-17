"use client";

import { usePostAuthLogout } from "@/api/generated/auth/auth";
import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import {
  getGetUsersMeQueryKey,
  usePutUsersMe,
} from "@/api/generated/profile/profile";
import {
  getGetWorkspacesMeQueryKey,
  useDeleteWorkspacesId,
  useDeleteWorkspacesIdLeave,
  usePutWorkspacesId,
} from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

type UseProfileActionsParams = {
  nickname: string;
  workspace: {
    id?: number | null;
    name?: string | null;
  } | null;
};

export const useProfileActions = ({
  nickname,
  workspace,
}: UseProfileActionsParams) => {
  const t = useTranslations("Profile");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const updateNicknameMutation = usePutUsersMe();
  const updateWorkspaceMutation = usePutWorkspacesId();
  const leaveWorkspaceMutation = useDeleteWorkspacesIdLeave();
  const deleteWorkspaceMutation = useDeleteWorkspacesId();
  const logoutMutation = usePostAuthLogout();

  const isActionPending =
    pendingAction !== null ||
    updateNicknameMutation.isPending ||
    leaveWorkspaceMutation.isPending ||
    deleteWorkspaceMutation.isPending ||
    logoutMutation.isPending;

  const invalidateWorkspaceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetUsersMeQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetWorkspacesMeQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetDashboardTeamQueryKey(undefined),
      }),
    ]);
  };

  const changeNickname = async () => {
    const next = prompt(t("promptNickname"), nickname);
    if (!next) {
      return;
    }

    try {
      setPendingAction("nickname");
      const response = await updateNicknameMutation.mutateAsync({
        data: { nickname: next },
      });

      if (response.status !== 200) {
        throw response;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetUsersMeQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardTeamQueryKey(undefined),
        }),
      ]);
      showToast("success", t("nicknameChanged"));
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("nicknameChangeFailed")));
    } finally {
      setPendingAction(null);
    }
  };

  const changeWorkspaceName = async () => {
    if (!workspace) {
      showToast("error", t("noWorkspaceToEdit"));
      return;
    }

    const next = prompt(t("promptWorkspaceName"), workspace.name ?? "")?.trim();

    if (!next || next === workspace.name) {
      return;
    }

    try {
      setPendingAction("workspace-name");
      const response = await updateWorkspaceMutation.mutateAsync({
        id: workspace.id ?? 0,
        data: { name: next },
      });

      if (response.status !== 200) {
        throw response;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetWorkspacesMeQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardTeamQueryKey(undefined),
        }),
      ]);
      showToast("success", t("workspaceNameChanged"));
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, t("workspaceNameChangeFailed")),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const logout = async () => {
    if (!confirm(t("confirmLogout"))) {
      return;
    }

    try {
      setPendingAction("logout");
      const response = await logoutMutation.mutateAsync();
      if (response.status !== 204) {
        throw response;
      }
    } catch {
      // Continue logout flow even when server-side logout fails.
    } finally {
      queryClient.clear();
      window.location.replace("/login");
    }
  };

  const leaveWorkspace = async () => {
    const workspaceId = workspace?.id ?? 0;
    if (workspaceId <= 0) {
      showToast("error", t("noWorkspaceToLeave"));
      return;
    }

    if (!confirm(t("confirmLeaveWorkspace"))) {
      return;
    }

    try {
      setPendingAction("workspace-leave");
      const response = await leaveWorkspaceMutation.mutateAsync({
        id: workspaceId,
      });

      if (response.status !== 204) {
        throw response;
      }

      await invalidateWorkspaceQueries();
      showToast("success", t("workspaceLeft"));
      router.replace("/dashboard/my");
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("workspaceLeaveFailed")));
    } finally {
      setPendingAction(null);
    }
  };

  const deleteWorkspace = async () => {
    const workspaceId = workspace?.id ?? 0;
    const workspaceName = workspace?.name?.trim() ?? "";

    if (workspaceId <= 0) {
      showToast("error", t("noWorkspaceToDelete"));
      return;
    }

    const confirmation = prompt(
      t("promptWorkspaceDeleteConfirm", { name: workspaceName }),
    )?.trim();

    if (!confirmation) {
      return;
    }

    if (confirmation !== workspaceName) {
      showToast("error", t("workspaceNameMismatch"));
      return;
    }

    if (!confirm(t("confirmDeleteWorkspaceWarning"))) {
      return;
    }

    if (!confirm(t("confirmDeleteWorkspace"))) {
      return;
    }

    try {
      setPendingAction("workspace-delete");
      const response = await deleteWorkspaceMutation.mutateAsync({
        id: workspaceId,
      });

      if (response.status !== 204) {
        throw response;
      }

      await invalidateWorkspaceQueries();
      showToast("success", t("workspaceDeleted"));
      router.replace("/dashboard/my");
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("workspaceDeleteFailed")));
    } finally {
      setPendingAction(null);
    }
  };

  return {
    changeNickname,
    changeWorkspaceName,
    deleteWorkspace,
    isActionPending,
    leaveWorkspace,
    logout,
    pendingAction,
  };
};
