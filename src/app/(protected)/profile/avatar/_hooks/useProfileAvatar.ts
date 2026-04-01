"use client";

import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import type { UserProfileUpdateRequest } from "@/api/generated/wig.schemas";
import {
  getGetUsersMeQueryKey,
  useGetUsersMe,
  usePutUsersMe,
} from "@/api/generated/profile/profile";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export const useProfileAvatar = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const hasHandledMissingUserRef = useRef(false);
  const { data: profileResponse, isLoading } = useGetUsersMe();
  const updateProfileMutation = usePutUsersMe();

  const user = profileResponse?.status === 200 ? profileResponse.data : null;

  useEffect(() => {
    if (isLoading || user || hasHandledMissingUserRef.current) {
      return;
    }

    hasHandledMissingUserRef.current = true;
    showToast("error", "프로필 정보를 불러오지 못해 홈으로 이동합니다.");
    router.replace("/dashboard/my");
  }, [isLoading, router, showToast, user]);

  const updateAvatar = async (
    currentAvatarKey: UserProfileUpdateRequest["avatarKey"],
    nextAvatarKey: UserProfileUpdateRequest["avatarKey"],
  ) => {
    if (currentAvatarKey === nextAvatarKey) {
      return;
    }

    if (!confirm("프로필 아이콘을 변경할까요?")) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await updateProfileMutation.mutateAsync({
        data: {
          avatarKey: nextAvatarKey,
        },
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
      showToast("success", "프로필 아이콘이 변경되었습니다.");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "프로필 아이콘 변경에 실패했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    user,
    updateAvatar,
  };
};
