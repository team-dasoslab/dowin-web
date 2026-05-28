"use client";

import { usePostAuthSignupComplete } from "@/api/generated/auth/auth";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";
import { useRouter } from "@/i18n/routing";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export default function SignupCompletePageClient({
  signupIntentId,
  checkoutId,
}: {
  signupIntentId: string;
  checkoutId: string;
}) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const completeMutation = usePostAuthSignupComplete();
  const hasRequestedRef = useRef(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasRequestedRef.current || recoveryCodes) {
      return;
    }

    if (!signupIntentId || !checkoutId) {
      setError(t("errors.signupCheckoutMissing"));
      return;
    }

    hasRequestedRef.current = true;

    completeMutation
      .mutateAsync({
        data: {
          signupIntentId,
          checkoutId,
        },
      })
      .then((response) => {
        if (
          response.status !== 201 ||
          !response.data.user ||
          !Array.isArray(response.data.recoveryCodes) ||
          response.data.recoveryCodes.length === 0
        ) {
          setError(t("errors.signupCompleteFailed"));
          return;
        }

        setRecoveryCodes(response.data.recoveryCodes);
        trackEvent("sign_up_completed", {
          signup_method: "basic_seat_checkout",
          user_id_hash: hashId(response.data.user.id),
        });
      })
      .catch((completeError) => {
        setError(
          getApiErrorMessage(completeError, t("errors.signupCompleteFailed")),
        );
      });
  }, [checkoutId, completeMutation, recoveryCodes, signupIntentId, t]);

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

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-zinc-50/50 px-4 py-12 overflow-y-auto selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>

      <Card className="w-full max-w-[480px] bg-white border border-border rounded-content p-8 md:p-12 animate-dowin-in relative z-10">
        <div className="flex flex-col items-center text-center space-y-5 mb-8">
          <div className="w-16 h-16 bg-white border border-border rounded-content flex items-center justify-center">
            <Logo size="32px" className="text-text-primary" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[24px] font-black tracking-tighter text-text-primary uppercase leading-none">
              {recoveryCodes ? t("recovery.title") : t("checkoutCompleteTitle")}
            </h1>
            <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
              {recoveryCodes
                ? t("recovery.description")
                : t("checkoutCompleteDescription")}
            </p>
          </div>
        </div>

        {!recoveryCodes && !error && (
          <div className="flex items-center justify-center py-12">
            <InlineSpinner />
          </div>
        )}

        {recoveryCodes && (
          <div className="mt-8 rounded-content border border-border bg-sub-background p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {recoveryCodes.map((code) => (
                <div
                  key={code}
                  className="rounded-button border border-border bg-sub-background px-3 py-3 text-center text-[13px] sm:text-sm font-black tracking-wider sm:tracking-widest text-text-primary truncate"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-danger/5 border border-danger/10 rounded-content">
            <p className="text-danger text-[12px] font-bold text-center leading-tight">
              {error}
            </p>
          </div>
        )}

        {recoveryCodes ? (
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button
              type="button"
              onClick={handleCopyRecoveryCodes}
              className="w-full rounded-button py-4 text-[13px] font-bold border border-border bg-white text-text-primary transition-all"
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
              className="w-full rounded-button py-4 text-[13px] font-bold border border-border bg-white text-text-primary transition-all"
            >
              {t("recovery.saveTxt")}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/")}
              className="w-full rounded-button py-4 text-[13px] font-black bg-text-primary text-white transition-all"
            >
              {t("continue")}
            </Button>
          </div>
        ) : (
          error && (
            <div className="mt-8">
              <Button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full rounded-button py-4 text-[13px] font-black bg-text-primary text-white transition-all"
              >
                {t("backToLogin")}
              </Button>
            </div>
          )
        )}
      </Card>

      <p className="absolute bottom-8 text-[11px] font-bold text-text-muted tracking-widest">
        © 2026 Dasoslab. All rights reserved.
      </p>
    </div>
  );
}
