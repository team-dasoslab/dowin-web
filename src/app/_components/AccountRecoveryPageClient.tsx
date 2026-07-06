"use client";

import { useAccountRecoveryForm } from "@/app/_hooks/useAccountRecoveryForm";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Link } from "@/i18n/routing";

export default function AccountRecoveryPageClient() {
  const {
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
  } = useAccountRecoveryForm();

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-y-auto selection:bg-primary/20">
      {/* Background Grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>

      <Card
        className="w-full max-w-[480px] animate-dowin-in relative z-10"
        radius="xl"
        padding="xl"
        variant="subtle"
      >
        <div className="flex flex-col items-start text-left space-y-5 mb-10">
          <DowinIcon
            name="auth-key-large"
            size="32px"
            className="text-text-primary"
          />
          <div className="space-y-1.5">
            <h1 className="text-[24px] font-black tracking-tighter text-text-primary uppercase leading-none">
              {t("recoveryPage.title")}
            </h1>
            <p className="text-[14px] text-text-muted font-medium tracking-tight break-keep">
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
                <div className="rounded-[24px] border-none bg-sub-background/50 p-5 space-y-4">
                  <p className="text-xs font-bold text-text-muted">
                    {t("recoveryPage.accountFound")}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-text-muted">
                        {t("nickname")}
                      </p>
                      <p className="text-[15px] font-bold text-text-primary truncate">
                        {recoveryAccount.nickname}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-text-muted">
                        {t("id")}
                      </p>
                      <p className="text-[15px] font-bold text-text-primary truncate">
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
            <div className="p-4 bg-danger/10 rounded-[24px] animate-shake">
              <p className="text-danger text-[13px] font-bold text-center leading-tight">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isPending}
              variant="hero"
              size="hero"
              className="w-full"
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
                className="text-[14px] font-semibold text-text-muted transition-colors active:text-text-primary"
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
