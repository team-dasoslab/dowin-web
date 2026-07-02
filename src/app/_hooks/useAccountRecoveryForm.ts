import {
  usePostAuthRecoveryCodesVerify,
  usePutAuthPasswordByRecoveryCode,
} from "@/api/generated/auth/auth";
import {
  getApiErrorMessage,
  getApiErrorStatus,
} from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { z } from "zod";

export const useAccountRecoveryForm = () => {
  const t = useTranslations("Auth");
  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .regex(
          /^[a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|:<>?,./~]{8,}$/,
          t("errors.invalidPassword"),
        ),
    [t],
  );

  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryAccount, setRecoveryAccount] = useState<{
    customId: string;
    nickname: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const verifyRecoveryCodeMutation = usePostAuthRecoveryCodesVerify();
  const resetPasswordByRecoveryCodeMutation =
    usePutAuthPasswordByRecoveryCode();

  const isPending =
    verifyRecoveryCodeMutation.isPending ||
    resetPasswordByRecoveryCodeMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!recoveryAccount) {
      try {
        const response = await verifyRecoveryCodeMutation.mutateAsync({
          data: {
            recoveryCode,
          },
        });

        if (response.status !== 200 || !response.data.user) {
          setError(t("recoveryPage.errors.checkCode"));
          return;
        }

        setRecoveryAccount(response.data.user);
        return;
      } catch (verifyError) {
        const status = getApiErrorStatus(verifyError);
        if (status === 404) {
          setError(t("recoveryPage.errors.checkCode"));
        } else {
          setError(
            getApiErrorMessage(verifyError, t("recoveryPage.errors.checkCode")),
          );
        }
        return;
      }
    }

    const parsedPassword = passwordSchema.safeParse(newPassword);
    if (!parsedPassword.success) {
      setError(
        parsedPassword.error.issues[0]?.message || t("errors.invalidPassword"),
      );
      return;
    }

    try {
      const response = await resetPasswordByRecoveryCodeMutation.mutateAsync({
        data: {
          recoveryCode,
          newPassword,
        },
      });

      if (response.status !== 200) {
        setError(t("recoveryPage.errors.resetFailed"));
        return;
      }

      setNotice(t("recoveryPage.resetSuccess"));
      setRecoveryAccount(null);
      setRecoveryCode("");
      setNewPassword("");
    } catch (resetError) {
      const status = getApiErrorStatus(resetError);
      if (status === 404) {
        setError(t("recoveryPage.errors.checkCode"));
      } else {
        setError(
          getApiErrorMessage(resetError, t("recoveryPage.errors.resetFailed")),
        );
      }
    }
  };

  return {
    error,
    notice,
    isPending,
    recoveryCode,
    setRecoveryCode,
    recoveryAccount,
    newPassword,
    setNewPassword,
    handleSubmit,
    t,
  };
};
