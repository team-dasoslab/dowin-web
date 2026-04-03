"use client";

import {
  usePostAuthLogout,
  usePutAuthPassword,
} from "@/api/generated/auth/auth";
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
import { validatePassword } from "@/domain/auth/validation";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const updateNicknameMutation = usePutUsersMe();
  const updateWorkspaceMutation = usePutWorkspacesId();
  const leaveWorkspaceMutation = useDeleteWorkspacesIdLeave();
  const deleteWorkspaceMutation = useDeleteWorkspacesId();
  const changePasswordMutation = usePutAuthPassword();
  const logoutMutation = usePostAuthLogout();

  const isActionPending =
    pendingAction !== null ||
    updateNicknameMutation.isPending ||
    leaveWorkspaceMutation.isPending ||
    deleteWorkspaceMutation.isPending ||
    changePasswordMutation.isPending ||
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
    const next = prompt("새로운 닉네임을 입력하세요:", nickname);
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
      showToast("success", "닉네임이 변경되었습니다.");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "닉네임 변경에 실패했습니다."),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const changePassword = async () => {
    const currentPw = prompt("현재 비밀번호를 입력하세요:")?.trim();
    if (!currentPw) {
      showToast("error", "현재 비밀번호를 입력해주세요.");
      return;
    }

    const newPw = prompt("새로운 비밀번호를 입력하세요:")?.trim();
    if (!newPw) {
      showToast("error", "새 비밀번호를 입력해주세요.");
      return;
    }

    if (!validatePassword(newPw)) {
      showToast(
        "error",
        "비밀번호는 8자 이상의 영문, 숫자, 허용된 특수문자 조합이어야 합니다.",
      );
      return;
    }

    try {
      setPendingAction("password");
      const response = await changePasswordMutation.mutateAsync({
        data: {
          currentPassword: currentPw,
          newPassword: newPw,
        },
      });

      if (response.status !== 200) {
        throw response;
      }

      showToast(
        "success",
        response.data.message || "비밀번호가 성공적으로 변경되었습니다.",
      );
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "비밀번호 변경에 실패했습니다."),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const changeWorkspaceName = async () => {
    if (!workspace) {
      showToast("error", "수정할 워크스페이스가 없습니다.");
      return;
    }

    const next = prompt(
      "새로운 워크스페이스 이름을 입력하세요:",
      workspace.name ?? "",
    )?.trim();

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
      showToast("success", "워크스페이스 이름이 변경되었습니다.");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "워크스페이스 이름 변경에 실패했습니다."),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const logout = async () => {
    if (!confirm("로그아웃할까요?")) {
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
      showToast("error", "탈퇴할 워크스페이스가 없습니다.");
      return;
    }

    if (!confirm("워크스페이스에서 탈퇴할까요?")) {
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
      showToast("success", "워크스페이스에서 탈퇴했습니다.");
      router.replace("/dashboard/my");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "워크스페이스 탈퇴에 실패했습니다."),
      );
    } finally {
      setPendingAction(null);
    }
  };

  const deleteWorkspace = async () => {
    const workspaceId = workspace?.id ?? 0;
    const workspaceName = workspace?.name?.trim() ?? "";

    if (workspaceId <= 0) {
      showToast("error", "삭제할 워크스페이스가 없습니다.");
      return;
    }

    const confirmation = prompt(
      `정말 삭제하려면 워크스페이스 이름을 입력하세요:\n${workspaceName}`,
    )?.trim();

    if (!confirmation) {
      return;
    }

    if (confirmation !== workspaceName) {
      showToast("error", "워크스페이스 이름이 일치하지 않습니다.");
      return;
    }

    if (
      !confirm(
        "워크스페이스를 삭제하면 멤버, 점수판, 선행지표, 기록이 모두 삭제됩니다. 계속할까요?",
      )
    ) {
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
      showToast("success", "워크스페이스를 삭제했습니다.");
      router.replace("/dashboard/my");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "워크스페이스 삭제에 실패했습니다."),
      );
    } finally {
      setPendingAction(null);
    }
  };

  return {
    changeNickname,
    changePassword,
    changeWorkspaceName,
    deleteWorkspace,
    isActionPending,
    leaveWorkspace,
    logout,
    pendingAction,
  };
};
