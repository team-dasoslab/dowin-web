"use client";

import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { ProductUpdateCard } from "@/app/[locale]/(protected)/profile/updates/_components/ProductUpdateCard";
import { useNativeApp } from "@/context/NativeAppContext";
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
    <ProtectedPageContainer className="max-w-[640px] pb-24 md:pb-10 lg:pb-12">
      <ProtectedPageHeader
        className="flex-row items-center justify-between"
        title={t("header")}
        rightElement={
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold tracking-tight text-primary">
            <span>{t("updateCount", { count: updates.length })}</span>
          </div>
        }
      />

      {/* 
      <div className="rounded-[24px] bg-surface px-6 py-6">
        <div className="max-w-[720px] space-y-3">
          <div>
            <Badge className="w-fit rounded-[8px] bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {t("recommendedBadge")}
            </Badge>

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
              className="rounded-[12px] bg-primary px-3 py-2 text-xs font-bold text-white"
            >
              <Link href={latestMajorUpdate.ctaHref}>{t("ctaLabel")}</Link>
            </Button>
          </div>
        </div>
      </div>
      */}

      <section className="space-y-4 pt-4">
        <div className="space-y-3">
          {updates.map((item) => {
            return <ProductUpdateCard key={item.id} item={item} />;
          })}
        </div>
      </section>
    </ProtectedPageContainer>
  );
}
