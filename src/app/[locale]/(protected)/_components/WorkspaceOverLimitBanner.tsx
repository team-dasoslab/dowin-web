"use client";

import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { publicRuntimeConfig } from "@/config/public-runtime-config";
import { useNativeApp } from "@/context/NativeAppContext";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

type WorkspaceOverLimitBannerProps = {
  freeMemberLimit?: number | null;
  isAdmin: boolean;
  memberCount?: number | null;
};

export function WorkspaceOverLimitBanner({
  freeMemberLimit,
  isAdmin,
  memberCount,
}: WorkspaceOverLimitBannerProps) {
  const t = useTranslations("WorkspaceOverLimit");
  const isNativeApp = useNativeApp();
  const showBillingSurface = publicRuntimeConfig.isDevelopment && !isNativeApp;
  const count = memberCount ?? 0;
  const limit = freeMemberLimit ?? 10;

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-red-800">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-red-600">
          <DowinIcon name="status-warning" size="16px" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-text-primary">{t("title")}</p>
            <p className="text-[11px] leading-relaxed text-text-muted">
              {isAdmin
                ? isNativeApp
                  ? t("adminDescApp", { count, limit })
                  : t("adminDesc", { count, limit })
                : isNativeApp
                  ? t("memberDescApp", { count, limit })
                  : t("memberDesc", { count, limit })}
            </p>
          </div>

          {isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-[11px] font-bold text-red-700"
              >
                <Link href="/profile/members">
                  <DowinIcon name="domain-people" size="14px" />
                  {t("manageMembers")}
                </Link>
              </Button>
              {showBillingSurface ? (
                <Button
                  asChild
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-[11px] font-bold text-white hover:bg-red-700"
                >
                  <Link href="/pricing">
                    <DowinIcon name="domain-payment" size="14px" />
                    {t("billing")}
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
