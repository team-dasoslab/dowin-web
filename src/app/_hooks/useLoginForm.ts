import { usePostAuthLogin, usePostAuthSignup } from "@/api/generated/auth/auth";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import {
  getApiErrorMessage,
  getApiErrorStatus,
} from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

type AuthMode = "login" | "signup";

export const useLoginForm = () => {
  const t = useTranslations("Auth");
  const [mode, setMode] = useState<AuthMode>("login");
  const [id, setId] = useState("");
  const [nickname, setNickname] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const loginMutation = usePostAuthLogin();
  const signupMutation = usePostAuthSignup();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isPending = loginMutation.isPending || signupMutation.isPending;

  const signupFormSchema = useMemo(
    () =>
      z.object({
        customId: z
          .string()
          .regex(/^[a-zA-Z0-9]{3,20}$/, t("errors.invalidId")),
        nickname: z
          .string()
          .min(1, t("errors.nicknameRequired"))
          .max(50, t("errors.nicknameTooLong")),
        password: z
          .string()
          .regex(
            /^[a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|:<>?,./~]{8,}$/,
            t("errors.invalidPassword"),
          ),
      }),
    [t],
  );

  useEffect(() => {
    const rawFlashToast = window.sessionStorage.getItem("dowin.flash.toast");
    if (!rawFlashToast) {
      return;
    }

    window.sessionStorage.removeItem("dowin.flash.toast");

    try {
      const parsed = JSON.parse(rawFlashToast) as {
        message?: string;
        type?: "success" | "error" | "info";
      };

      if (!parsed.message || !parsed.type) {
        return;
      }

      showToast(parsed.type, parsed.message);
    } catch {
      // Ignore malformed flash toast payloads.
    }
  }, [showToast]);

  const resetErrorAndSwitchMode = (nextMode: AuthMode) => {
    setError("");
    setMode(nextMode);
  };

  const handleCopyRecoveryCodes = async () => {
    if (!recoveryCodes || recoveryCodes.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(recoveryCodes.join(", "));
      setIsCopied(true);
    } catch {
      setError(t("recovery.failedToCopy"));
    }
  };

  const handleDownloadRecoveryCodes = () => {
    if (!recoveryCodes || recoveryCodes.length === 0) {
      return;
    }

    const content = [
      t("recovery.txtHeader"),
      "",
      t("recovery.txtDescription"),
      "",
      recoveryCodes.join(", "),
      "",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dowin-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      const parsed = signupFormSchema.safeParse({
        customId: id,
        nickname,
        password: pw,
      });

      if (!parsed.success) {
        const errorMsg = parsed.error.issues[0]?.message;
        setError(errorMsg || t("errors.checkInputs"));
        return;
      }

      try {
        const response = await signupMutation.mutateAsync({
          data: {
            customId: parsed.data.customId,
            nickname: parsed.data.nickname,
            password: parsed.data.password,
          },
        });

        if (
          response.status !== 201 ||
          !response.data.user ||
          !Array.isArray(response.data.recoveryCodes) ||
          response.data.recoveryCodes.length === 0
        ) {
          setError(t("errors.signupFailed"));
          return;
        }

        setRecoveryCodes(response.data.recoveryCodes);
        setIsCopied(false);
        trackEvent("sign_up_completed", {
          signup_method: "self_signup",
          user_id_hash: hashId(response.data.user.id),
        });
      } catch (signupError) {
        const status = getApiErrorStatus(signupError);
        if (status === 409) {
          setError(t("errors.idAlreadyExists"));
        } else {
          setError(getApiErrorMessage(signupError, t("errors.signupFailed")));
        }
      }

      return;
    }

    try {
      const response = await loginMutation.mutateAsync({
        data: {
          customId: id,
          password: pw,
        },
      });

      if (response.status !== 200 || !response.data.user) {
        setError(t("errors.loginFailed"));
        return;
      }

      window.sessionStorage.setItem("dowin.intent.push-prompt", "true");
      const nextPath = searchParams.get("next");
      router.push(nextPath || "/");
    } catch (loginError) {
      const status = getApiErrorStatus(loginError);
      if (status === 401) {
        setError(t("errors.loginFailed"));
      } else {
        setError(getApiErrorMessage(loginError, t("errors.loginFailed")));
      }
    }
  };

  return {
    t,
    mode,
    id,
    setId,
    nickname,
    setNickname,
    pw,
    setPw,
    error,
    recoveryCodes,
    isCopied,
    isPending,
    router,
    resetErrorAndSwitchMode,
    handleCopyRecoveryCodes,
    handleDownloadRecoveryCodes,
    handleSubmit,
  };
};
