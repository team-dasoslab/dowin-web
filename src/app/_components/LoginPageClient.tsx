"use client";

import {
  postAuthSignupCheckout,
  usePostAuthLogin,
} from "@/api/generated/auth/auth";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useToast } from "@/context/ToastContext";
import { Link, useRouter } from "@/i18n/routing";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiErrorStatus,
} from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
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
  const [workspaceName, setWorkspaceName] = useState("");
  const [seatCount, setSeatCount] = useState("1");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [isSignupCheckoutPending, setIsSignupCheckoutPending] = useState(false);
  const loginMutation = usePostAuthLogin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isPending = loginMutation.isPending || isSignupCheckoutPending;

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
        workspaceName: z
          .string()
          .trim()
          .min(1, t("errors.workspaceNameRequired"))
          .max(100, t("errors.workspaceNameTooLong")),
        seatCount: z.coerce
          .number()
          .int(t("errors.invalidSeatCount"))
          .min(1, t("errors.invalidSeatCount"))
          .max(999, t("errors.invalidSeatCount")),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      const parsed = signupFormSchema.safeParse({
        customId: id,
        nickname,
        workspaceName,
        seatCount,
        password: pw,
      });

      if (!parsed.success) {
        const errorMsg = parsed.error.issues[0]?.message;
        setError(errorMsg || t("errors.checkInputs"));
        return;
      }

      try {
        setIsSignupCheckoutPending(true);
        const response = await postAuthSignupCheckout(
          {
            customId: parsed.data.customId,
            nickname: parsed.data.nickname,
            password: parsed.data.password,
            workspaceName: parsed.data.workspaceName,
            seatCount: parsed.data.seatCount,
          },
          {
            headers: {
              "Idempotency-Key": createSignupIdempotencyKey(),
            },
          },
        );

        if (
          response.status !== 201 ||
          !response.data.checkoutUrl ||
          !response.data.signupIntentId
        ) {
          setError(t("errors.signupFailed"));
          return;
        }

        trackEvent("sign_up_checkout_started", {
          signup_method: "basic_seat_checkout",
        });
        window.location.assign(response.data.checkoutUrl);
      } catch (signupError) {
        const code = getApiErrorCode(signupError);
        if (code === "CUSTOM_ID_ALREADY_EXISTS") {
          setError(t("errors.idAlreadyExists"));
        } else if (code === "BILLING_NOT_READY") {
          setError(t("errors.billingNotReady"));
        } else {
          setError(getApiErrorMessage(signupError, t("errors.signupFailed")));
        }
      } finally {
        setIsSignupCheckoutPending(false);
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

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-zinc-50/50 px-4 py-12 overflow-y-auto selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>

      <Card className="w-full max-w-[480px] bg-white border border-border rounded-content p-8 md:p-12 animate-dowin-in relative z-10">
        <div className="flex flex-col items-center text-center space-y-5 mb-12">
          <div className="w-16 h-16 bg-white border border-border rounded-content flex items-center justify-center">
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
              <div className="space-y-2 animate-fade-in-up">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">
                  {t("nickname")}
                </label>
                <Input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t("nicknamePlaceholder")}
                  className="w-full px-5 py-4 bg-sub-background border border-border rounded-content text-sm focus:border-primary focus:bg-white outline-none transition-all placeholder:text-text-muted font-bold"
                  required
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2 animate-fade-in-up">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">
                  {t("workspaceName")}
                </label>
                <Input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder={t("workspaceNamePlaceholder")}
                  className="w-full px-5 py-4 bg-sub-background border border-border rounded-content text-sm focus:border-primary focus:bg-white outline-none transition-all placeholder:text-text-muted font-bold"
                  required
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-2 animate-fade-in-up">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">
                  {t("seatCount")}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={seatCount}
                  onChange={(e) => setSeatCount(e.target.value)}
                  placeholder={t("seatCountPlaceholder")}
                  className="w-full px-5 py-4 bg-sub-background border border-border rounded-content text-sm focus:border-primary focus:bg-white outline-none transition-all placeholder:text-text-muted font-bold"
                  required
                />
                <p className="px-1 text-[12px] font-bold leading-relaxed text-text-muted">
                  {t("signupPaymentNotice")}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">
                {t("id")}
              </label>
              <Input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={t("idPlaceholder")}
                className="w-full px-5 py-4 bg-sub-background border border-border rounded-content text-sm focus:border-primary focus:bg-white outline-none transition-all placeholder:text-text-muted font-bold"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">
                {t("password")}
              </label>
              <PasswordInput
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full rounded-content border border-border bg-sub-background px-5 py-4 pr-14 text-sm font-bold outline-none transition-all placeholder:text-text-muted focus:border-primary focus:bg-white"
                toggleClassName="absolute right-4 top-1/2 flex -tranzinc-y-1/2 items-center text-text-muted transition-colors"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-danger/5 border border-danger/10 rounded-content animate-shake">
              <p className="text-danger text-[12px] font-bold text-center leading-tight">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isPending}
              className={`
                w-full py-4 flex items-center justify-center gap-3 rounded-button text-[15px] font-black transition-all
                ${isPending
                  ? "bg-sub-background text-text-muted cursor-not-allowed border border-border"
                  : "bg-text-primary text-white"
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
                    <span>{t("startCheckout")}</span>
                  )}
                </>
              )}
            </Button>

            <div className="text-center space-y-3">
              {mode === "login" ? (
                <>
                  <Link
                    href="/account-recovery"
                    className="block text-[13px] font-bold text-text-muted transition-colors"
                  >
                    {t("forgotPassword")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => resetErrorAndSwitchMode("signup")}
                    className="text-[13px] font-bold text-primary transition-colors"
                  >
                    {t("noAccount")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => resetErrorAndSwitchMode("login")}
                  className="text-[13px] font-bold text-primary transition-colors"
                >
                  {t("hasAccount")}
                </button>
              )}
            </div>
          </div>
        </form>
      </Card>

      <p className="absolute bottom-8 text-[11px] font-bold text-text-muted tracking-widest">
        © 2026 Dasoslab. All rights reserved.
      </p>
    </div>
  );
}

function createSignupIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `signup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
