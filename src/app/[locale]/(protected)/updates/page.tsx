"use client";

import { ProductUpdateCard } from "@/app/[locale]/(protected)/updates/_components/ProductUpdateCard";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNativeApp } from "@/context/NativeAppContext";
import { Link } from "@/i18n/routing";
import {
  getLatestMajorProductUpdate,
  getProductUpdates,
} from "@/lib/product-updates";
import { useTranslations } from "next-intl";

export default function UpdatesPage() {
  const t = useTranslations("ProductUpdates");
  const isNativeApp = useNativeApp();
  const updates = getProductUpdates().filter(
    (item) => !isNativeApp || item.plan !== "STANDARD",
  );
  const latestMajorUpdate =
    updates.find((update) => update.isMajor) ??
    (!isNativeApp ? getLatestMajorProductUpdate() : null);

  if (!latestMajorUpdate) {
    return null;
  }

  return (
    <ProtectedPageContainer spacing="compact" topPadding="compact">
      <ProtectedPageHeader title={t("header")} />

      <div className="rounded-content border border-border bg-dowin-surface-gradient px-4 py-4">
        <div className="max-w-[720px] space-y-3">
          <div>
            <Badge className="w-fit rounded-button border border-primary/15 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {t("recommendedBadge")}
            </Badge>
            {!isNativeApp && latestMajorUpdate.plan === "STANDARD" && (
              <Badge className="ml-2 w-fit rounded-button border border-primary/15 bg-white/80 px-2 py-1 text-[10px] font-bold text-primary">
                STANDARD
              </Badge>
            )}
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              {t(`updates.${latestMajorUpdate.id}.title`)}
            </h1>
            <p className="max-w-[520px] text-sm leading-6 text-text-secondary">
              {t(`updates.${latestMajorUpdate.id}.summary`)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] leading-none text-text-muted">
            <span>{latestMajorUpdate.publishedAt}</span>
            <span className="text-border">•</span>
            <span>{t(`tags.${latestMajorUpdate.tag}`)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              asChild
              className="rounded-button bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90"
            >
              <Link href={latestMajorUpdate.ctaHref}>{t("ctaLabel")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-text-primary">
              {t("latestTitle")}
            </h2>
            <p className="text-[11px] text-text-muted">{t("latestDesc")}</p>
          </div>
          <div className="flex items-center gap-2 rounded-content border border-border bg-white px-3 py-2 text-[11px] text-text-muted">
            <span>{t("updateCount", { count: updates.length })}</span>
          </div>
        </div>

        <div className="space-y-3">
          {updates.map((item) => {
            return <ProductUpdateCard key={item.id} item={item} />;
          })}
        </div>
      </section>
    </ProtectedPageContainer>
  );
}
