"use client";


import {
  getGetUsersMeQueryKey,
  useGetUsersMe,
  usePutUsersMe,
} from "@/api/generated/profile/profile";
import type { UserProfileUpdateRequest } from "@/api/generated/dowin.schemas";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export const useProfileAvatar = () => {
  const t = useTranslations("Profile");
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
    showToast("error", t("profileLoadFailedDashboard"));
    router.replace("/");
  }, [isLoading, router, showToast, user, t]);

  const updateAvatar = async (
    currentAvatarKey: UserProfileUpdateRequest["avatarKey"],
    nextAvatarKey: UserProfileUpdateRequest["avatarKey"],
  ) => {
    if (currentAvatarKey === nextAvatarKey) {
      return;
    }

    if (!confirm(t("confirmChangeAvatar"))) {
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
          predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/dashboard/team'),
        }),
      ]);
      showToast("success", t("avatarChanged"));
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("avatarChangeFailed")));
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
