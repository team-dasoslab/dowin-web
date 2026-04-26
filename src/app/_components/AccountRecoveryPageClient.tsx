"use client";

import {
  usePostAuthRecoveryCodesVerify,
  usePutAuthPasswordByRecoveryCode,
} from "@/api/generated/auth/auth";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Input } from "@/components/ui/Input";
import { Link } from "@/i18n/routing";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { z } from "zod";



export default function AccountRecoveryPageClient() {
  const t = useTranslations("Auth");
  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .regex(/^[a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|:<>?,./~]{8,}$/, t("errors.invalidPassword")),
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
          setError(getApiErrorMessage(verifyError, t("recoveryPage.errors.checkCode")));
        }
        return;
      }
    }

    const parsedPassword = passwordSchema.safeParse(newPassword);
    if (!parsedPassword.success) {
      setError(parsedPassword.error.issues[0]?.message || t("errors.invalidPassword"));
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
        setError(getApiErrorMessage(resetError, t("recoveryPage.errors.resetFailed")));
      }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-zinc-50/50 px-4 font-pretendard overflow-hidden selection:bg-primary/20">
      {/* Background Grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>

      <Card className="w-full max-w-[460px] bg-white border border-zinc-200 rounded-content p-8 md:p-12 animate-dowin-in relative z-10">
        <div className="flex flex-col items-center text-center space-y-5 mb-10">
          <div className="w-16 h-16 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center">
            <DowinIcon
              name="auth-key-large"
              className="text-text-primary"
              size="32px"
            />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[24px] font-black tracking-tighter text-text-primary font-outfit uppercase leading-none">
              {t("recoveryPage.title")}
            </h1>
            <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep px-4">
              {t("recoveryPage.description")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">
                {t("recoveryPage.codeLabel")}
              </label>
              <Input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="6JYS-B959TK"
                className="w-full px-5 py-4 bg-sub-background border border-border rounded-content text-sm focus:border-primary focus:bg-white outline-none transition-all placeholder:text-text-muted font-bold uppercase tracking-wider"
                required
                disabled={isPending || Boolean(recoveryAccount)}
              />
              <p className="text-[11px] text-text-muted font-medium ml-1">
                {t("recoveryPage.codeHint")}
              </p>
            </div>

            {recoveryAccount && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="rounded-content border border-border bg-sub-background p-5 space-y-4">
                  <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em]">
                    {t("recoveryPage.accountFound")}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                        {t("nickname")}
                      </p>
                      <p className="text-sm font-bold text-text-primary truncate">
                        {recoveryAccount.nickname}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                        {t("id")}
                      </p>
                      <p className="text-sm font-bold text-text-primary truncate">
                        {recoveryAccount.customId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">
                    {t("recoveryPage.newPassword")}
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-sub-background border border-border rounded-content text-sm focus:border-primary focus:bg-white outline-none transition-all placeholder:text-text-muted font-bold"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>
            )}
          </div>

          {notice && (
            <div className="p-4 bg-success/5 border border-success/10 rounded-content">
              <p className="text-success text-[12px] font-bold text-center leading-tight">
                {notice}
              </p>
            </div>
          )}

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
                ${
                  isPending
                    ? "bg-sub-background text-text-muted cursor-not-allowed border border-border"
                    : "bg-text-primary text-white"
                }
              `}
            >
              {isPending ? (
                <InlineSpinner />
              ) : (
                <>
                  <span>
                    {recoveryAccount
                      ? t("recoveryPage.resetButton")
                      : t("recoveryPage.findButton")}
                  </span>
                </>
              )}
            </Button>

            <div className="text-center">
                <Link
                  href="/login"
                  className="text-[13px] font-bold text-text-muted transition-colors"
                >
                  {t("recoveryPage.backToLogin")}
                </Link>
            </div>
          </div>
        </form>
      </Card>

      <p className="absolute bottom-8 text-[11px] font-bold text-text-muted tracking-widest font-outfit">
        © 2026 Dasoslab. All rights reserved.
      </p>
    </div>
  );
}
