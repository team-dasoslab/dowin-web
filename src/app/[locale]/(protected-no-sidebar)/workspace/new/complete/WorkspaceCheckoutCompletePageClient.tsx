"use client";

import { postWorkspacesCheckoutComplete } from "@/api/generated/workspace/workspace";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { Link } from "@/i18n/routing";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type Props = {
  checkoutId: string;
  workspaceCheckoutId: string;
};

export default function WorkspaceCheckoutCompletePageClient({
  checkoutId,
  workspaceCheckoutId,
}: Props) {
  const t = useTranslations("Workspace.new");
  const locale = useLocale();
  const [error, setError] = useState("");
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (hasCompletedRef.current) {
      return;
    }
    hasCompletedRef.current = true;

    if (!workspaceCheckoutId) {
      setError(t("checkoutMissing"));
      return;
    }

    void postWorkspacesCheckoutComplete({
      workspaceCheckoutId,
      ...(checkoutId ? { checkoutId } : {}),
    })
      .then((response) => {
        const workspaceId =
          response.status === 201 ? response.data.workspaceId : "";

        if (!workspaceId) {
          setError(t("checkoutCompleteFailed"));
          return;
        }

        window.location.href = `/${locale}/${workspaceId}/setup`;
      })
      .catch((error) => {
        setError(getApiErrorMessage(error, t("checkoutCompleteFailed")));
      });
  }, [checkoutId, locale, t, workspaceCheckoutId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[420px] bg-white border border-zinc-200 rounded-content p-8 md:p-10 space-y-8 animate-dowin-in">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-content bg-primary/10">
            <Logo size="24px" className="text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">
              {t("checkoutCompleteTitle")}
            </h1>
            <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-zinc-500">
              {t("checkoutCompleteDescription")}
            </p>
          </div>
        </div>

        {!error ? (
          <div className="flex justify-center py-6">
            <InlineSpinner />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-content border border-red-100 bg-red-50 p-4">
              <p className="text-center text-xs font-bold text-red-600">
                {error}
              </p>
            </div>
            <Button
              asChild
              className="w-full rounded-button py-4 text-sm font-black"
            >
              <Link href="/workspace/new">{t("backToWorkspaceNew")}</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
