"use client";

import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { Warning20Regular, Payment20Regular, People20Regular } from "@fluentui/react-icons";
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
  const count = memberCount ?? 0;
  const limit = freeMemberLimit ?? 10;

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-red-800">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-red-600">
          <Warning20Regular className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-text-primary">
              {t("title")}
            </p>
            <p className="text-[11px] leading-relaxed text-text-muted">
              {isAdmin
                ? t("adminDesc", { count, limit })
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
                   <People20Regular className="h-3.5 w-3.5" />
                  {t("manageMembers")}
                </Link>
              </Button>
              <Button
                asChild
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-[11px] font-bold text-white hover:bg-red-700"
              >
                <Link href="/profile/billing">
                   <Payment20Regular className="h-3.5 w-3.5" />
                  {t("billing")}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
