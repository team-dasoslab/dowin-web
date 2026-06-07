"use client";

import { usePostAuthLogin, usePostAuthSignup } from "@/api/generated/auth/auth";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/context/ToastContext";
import { Link, useRouter } from "@/i18n/routing";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

type AuthMode = "login" | "signup";

export default function LoginPageClient() {
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

  if (recoveryCodes) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-zinc-50/50 px-4 py-12 overflow-y-auto selection:bg-primary/20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>

        <Card className="w-full max-w-[480px] bg-white border-none rounded-[24px] p-8 md:p-12 animate-dowin-in relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="space-y-4 text-center mb-8">
            <h1 className="text-[24px] font-black tracking-tighter text-text-primary uppercase leading-none">
              {t("recovery.title")}
            </h1>
            <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
              {t("recovery.description")}
            </p>
          </div>

          <div className="mt-8 rounded-[24px] border-none bg-zinc-50 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {recoveryCodes.map((code) => (
                <div
                  key={code}
                  className="rounded-[12px] border-none bg-white px-3 py-4 text-center text-[15px] sm:text-[16px] font-mono font-bold tracking-widest text-zinc-900 truncate shadow-sm"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-danger/5 border border-danger/10 rounded-content">
              <p className="text-danger text-[12px] font-bold text-center leading-tight">
                {error}
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleCopyRecoveryCodes}
                className="flex-1 h-[56px] rounded-[24px] text-[15px] font-semibold border-none bg-zinc-100 text-zinc-700 transition-colors active:scale-[0.98]"
              >
                {isCopied ? (
                  <span className="inline-flex items-center gap-2">
                    <DowinIcon
                      name="status-checkmark"
                      size="16px"
                      className="text-success"
                    />
                    {t("recovery.copied")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <DowinIcon
                      name="action-copy"
                      size="16px"
                      className="opacity-50"
                    />
                    {t("recovery.copy")}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleDownloadRecoveryCodes}
                className="flex-1 h-[56px] rounded-[24px] text-[15px] font-semibold border-none bg-zinc-100 text-zinc-700 transition-colors active:scale-[0.98]"
              >
                {t("recovery.saveTxt")}
              </Button>
            </div>
            <Button
              type="button"
              onClick={() => {
                router.push("/workspace/new");
              }}
              className="w-full h-[56px] rounded-[24px] text-[17px] font-bold border-none bg-primary text-white transition-transform active:scale-[0.98]"
            >
              {t("continue")}
            </Button>
          </div>
        </Card>

        <p className="absolute bottom-8 text-[11px] font-bold text-text-muted tracking-widest">
          © 2026 Dasoslab. All rights reserved.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-zinc-50/50 px-4 py-12 overflow-y-auto selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>

      <Card className="w-full max-w-[480px] bg-white border-none rounded-[24px] p-8 md:p-12 animate-dowin-in relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col items-center text-center space-y-5 mb-12">
          <div className="w-16 h-16 bg-white border-none rounded-[16px] flex items-center justify-center shadow-sm">
            <Logo size="32px" className="text-text-primary" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[24px] font-black tracking-tighter text-text-primary leading-none">
              {mode === "login" ? t("login") : t("signup")}
            </h1>
            <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
              {mode === "login" ? t("subtitle") : t("signupSubtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-5">
            {mode === "signup" && (
              <Input
                label={t("nickname")}
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t("nicknamePlaceholder")}
                containerClassName="animate-fade-in-up"
                required
              />
            )}

            <Input
              label={t("id")}
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={t("idPlaceholder")}
              required
            />

            <PasswordInput
              label={t("password")}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-danger/5 border border-danger/10 rounded-content animate-shake">
              <p className="text-danger text-[12px] font-bold text-center leading-tight">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isPending}
              className={`
                h-[56px] w-full flex items-center justify-center gap-3 rounded-[24px] text-[16px] font-semibold transition-transform active:scale-[0.98]
                ${isPending
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  : "bg-primary text-white"
                }
              `}
            >
              {isPending ? (
                <InlineSpinner />
              ) : (
                <>
                  {mode === "login" ? (
                    <span>{t("login")}</span>
                  ) : (
                    <span>{t("signup")}</span>
                  )}
                </>
              )}
            </Button>

            {mode === "login" ? (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => resetErrorAndSwitchMode("signup")}
                  className="text-[14px] font-semibold text-zinc-500 transition-colors active:text-zinc-800"
                >
                  {t("signup")}
                </button>
                <span className="h-3 w-[1px] bg-zinc-300" />
                <Link
                  href="/account-recovery"
                  className="text-[14px] font-semibold text-zinc-500 transition-colors active:text-zinc-800"
                >
                  {t("recoveryPage.title")}
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-center pt-4">
                <button
                  type="button"
                  onClick={() => resetErrorAndSwitchMode("login")}
                  className="text-[14px] font-semibold text-zinc-500 transition-colors active:text-zinc-800"
                >
                  {t("login")}
                </button>
              </div>
            )}
          </div>
        </form>
      </Card>

      <p className="absolute bottom-8 text-[11px] font-bold text-text-muted tracking-widest">
        © 2026 Dasoslab. All rights reserved.
      </p>
    </div>
  );
}
