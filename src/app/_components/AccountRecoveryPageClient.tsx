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
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Link } from "@/i18n/routing";
import {
  getApiErrorMessage,
  getApiErrorStatus,
} from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { z } from "zod";

export default function AccountRecoveryPageClient() {
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

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-y-auto selection:bg-primary/20">
      {/* Background Grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>

      <Card className="w-full max-w-[480px] bg-white border-none rounded-[24px] p-8 md:p-12 animate-dowin-in relative z-10">
        <div className="flex flex-col items-center text-center space-y-5 mb-10">
          <div className="w-16 h-16 bg-white border-none rounded-[16px] flex items-center justify-center">
            <DowinIcon
              name="auth-key-large"
              size="32px"
              className="text-zinc-900"
            />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[24px] font-black tracking-tighter text-zinc-900 uppercase leading-none">
              {t("recoveryPage.title")}
            </h1>
            <p className="text-[14px] text-zinc-500 font-medium tracking-tight break-keep px-4">
              {t("recoveryPage.description")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <Input
                label={t("recoveryPage.codeLabel")}
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="6JYS-B959TK"
                className="uppercase tracking-wider"
                required
                disabled={isPending || Boolean(recoveryAccount)}
              />
              <p className="text-[11px] text-zinc-400 font-medium ml-1 mt-2">
                {t("recoveryPage.codeHint")}
              </p>
            </div>

            {recoveryAccount && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="rounded-[24px] border-none bg-zinc-100/50 p-5 space-y-4">
                  <p className="text-xs font-bold text-zinc-500">
                    {t("recoveryPage.accountFound")}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-zinc-500">
                        {t("nickname")}
                      </p>
                      <p className="text-[15px] font-bold text-zinc-900 truncate">
                        {recoveryAccount.nickname}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-zinc-500">
                        {t("id")}
                      </p>
                      <p className="text-[15px] font-bold text-zinc-900 truncate">
                        {recoveryAccount.customId}
                      </p>
                    </div>
                  </div>
                </div>

                <PasswordInput
                  label={t("recoveryPage.newPassword")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          {notice && (
            <div className="p-4 bg-blue-50 rounded-[24px]">
              <p className="text-blue-500 text-[13px] font-bold text-center leading-tight">
                {notice}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 rounded-[24px] animate-shake">
              <p className="text-red-500 text-[13px] font-bold text-center leading-tight">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isPending}
              className={`
                h-[56px] w-full flex items-center justify-center gap-3 rounded-[24px] text-[16px] font-bold transition-colors
                ${isPending
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
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
                className="text-[14px] font-semibold text-zinc-500 transition-colors active:text-zinc-800"
              >
                {t("recoveryPage.backToLogin")}
              </Link>
            </div>
          </div>
        </form>
      </Card>

      <p className="absolute bottom-8 text-[11px] font-bold text-zinc-400 tracking-widest">
        © 2026 Dasoslab. All rights reserved.
      </p>
    </div>
  );
}
