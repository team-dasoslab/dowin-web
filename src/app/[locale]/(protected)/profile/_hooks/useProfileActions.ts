"use client";

import { usePostAuthLogout } from "@/api/generated/auth/auth";

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
import { useNativeApp } from "@/context/NativeAppContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import { getApiErrorMessage, getFetchErrorMessage } from "@/lib/client/frontend-api";
import { getPushToken } from "@/lib/bridge";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

type UseProfileActionsParams = {
  nickname: string;
  workspace: {
    id?: string | null;
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
  const isNativeApp = useNativeApp();
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
        queryKey: ['workspaces'],
      }),
      queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/dashboard/team'),
      }),
    ]);
  };

  const changeNickname = async () => {
    const next = prompt(t("promptNickname"), nickname);
    if (!next) {
      return;
    }

    if (next.trim().length > 10) {
      showToast("error", "닉네임은 10자 이하여야 합니다.");
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

      await invalidateWorkspaceQueries();
      showToast("success", t("nicknameChanged"));
      router.refresh();
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

    if (next.length > 20) {
      showToast("error", "워크스페이스 이름은 20자 이하여야 합니다.");
      return;
    }

    try {
      setPendingAction("workspace-name");
      const response = await updateWorkspaceMutation.mutateAsync({
        id: workspace.id ?? "",
        data: { name: next },
      });

      if (response.status !== 200) {
        throw response;
      }

      await invalidateWorkspaceQueries();
      showToast("success", t("workspaceNameChanged"));
      router.refresh();
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
      if (isNativeApp) {
        try {
          const token = await getPushToken();

          if (token) {
            const response = await fetch("/api/notifications/devices", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token }),
            });

            if (!response.ok && response.status !== 401) {
              throw new Error(
                await getFetchErrorMessage(
                  response,
                  "디바이스 알림 토큰 비활성화에 실패했습니다.",
                ),
              );
            }
          }
        } catch (error) {
          console.error("Failed to disable current device push token:", error);
        }
      }

      const response = await logoutMutation.mutateAsync();
      if (response.status !== 204) {
        throw response;
      }
    } catch {
      // Continue logout flow even when server-side logout fails.
    } finally {
      queryClient.clear();
      router.replace("/login");
    }
  };

  const leaveWorkspace = async () => {
    const workspaceId = workspace?.id ?? "";
    if (!workspaceId) {
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
      router.refresh();
      router.replace("/");
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("workspaceLeaveFailed")));
    } finally {
      setPendingAction(null);
    }
  };

  const deleteWorkspace = async () => {
    const workspaceId = workspace?.id ?? "";
    const workspaceName = workspace?.name?.trim() ?? "";

    if (!workspaceId) {
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
      router.refresh();
      router.replace("/");
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
