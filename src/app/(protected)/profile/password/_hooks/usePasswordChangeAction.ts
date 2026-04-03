"use client";

import { usePutAuthPassword } from "@/api/generated/auth/auth";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UsePasswordChangeActionParams = {
  currentPassword: string;
  newPassword: string;
  validate: () => string | null;
};

export const usePasswordChangeAction = ({
  currentPassword,
  newPassword,
  validate,
}: UsePasswordChangeActionParams) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const changePasswordMutation = usePutAuthPassword();

  const submit = async () => {
    const errorMessage = validate();
    if (errorMessage) {
      showToast("error", errorMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await changePasswordMutation.mutateAsync({
        data: {
          currentPassword,
          newPassword,
        },
      });

      if (response.status !== 200) {
        throw response;
      }

      showToast(
        "success",
        response.data.message || "비밀번호가 성공적으로 변경되었습니다.",
      );
      router.replace("/profile");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "비밀번호 변경에 실패했습니다."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting: isSubmitting || changePasswordMutation.isPending,
    submit,
  };
};
