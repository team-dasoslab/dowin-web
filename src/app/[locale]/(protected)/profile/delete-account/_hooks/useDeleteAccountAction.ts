"use client";

import { useDeleteUsersMe } from "@/api/generated/profile/profile";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";

type UseDeleteAccountActionParams = {
  currentPassword: string;
  validate: () => string | null;
};

export const useDeleteAccountAction = ({
  currentPassword,
  validate,
}: UseDeleteAccountActionParams) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deleteAccountMutation = useDeleteUsersMe();

  const t = useTranslations("ProfileDeleteAccount");

  const submit = async () => {
    const errorMessage = validate();
    if (errorMessage) {
      showToast("error", errorMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await deleteAccountMutation.mutateAsync({
        data: { currentPassword },
      });

      if (response.status !== 204) {
        throw response;
      }

      window.sessionStorage.setItem(
        "wig.flash.toast",
        JSON.stringify({
          message: t("deleteSuccess"),
          type: "success",
        }),
      );
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("deleteFailed")));
      setIsSubmitting(false);
      return;
    }

    queryClient.clear();
    router.replace("/login");
  };

  return {
    isSubmitting: isSubmitting || deleteAccountMutation.isPending,
    submit,
  };
};
