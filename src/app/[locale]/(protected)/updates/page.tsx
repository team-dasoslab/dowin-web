"use client";

import { ProductUpdateCard } from "@/app/[locale]/(protected)/updates/_components/ProductUpdateCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { productUpdates } from "@/content/product-updates";
import { Link } from "@/i18n/routing";
import {
  getLatestMajorProductUpdate,
  getProductUpdates,
} from "@/lib/product-updates";
import { useTranslations } from "next-intl";

export default function UpdatesPage() {
  const t = useTranslations("ProductUpdates");
  const updates = getProductUpdates();
  const latestMajorUpdate = getLatestMajorProductUpdate();

  if (!latestMajorUpdate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto max-w-[680px] space-y-6 p-4 md:p-8 animate-linear-in">
        <header className="flex items-center justify-between">
          <SmartBackButton className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-[rgba(205,207,213,1)] hover:text-text-primary" />
          <p className="text-xs text-text-muted">{t("header")}</p>
          <div className="w-8" />
        </header>

        <Card className="overflow-hidden rounded-lg border border-border">
          <div className="relative bg-[linear-gradient(135deg,rgba(49,81,255,0.10),rgba(255,255,255,0.96)_55%,rgba(49,81,255,0.04))] px-5 py-5 sm:px-6">
            <div className="max-w-[84%] space-y-3">
              <div>
                <Badge className="w-fit rounded-md border border-primary/15 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  {t("recommendedBadge")}
                </Badge>
                {latestMajorUpdate.plan === "STANDARD" && (
                  <Badge className="ml-2 w-fit rounded-md border border-primary/15 bg-white/80 px-2 py-1 text-[10px] font-bold text-primary">
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
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90"
                >
                  <Link href={latestMajorUpdate.ctaHref}>{t("ctaLabel")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                {t("latestTitle")}
              </h2>
              <p className="text-[11px] text-text-muted">{t("latestDesc")}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-[11px] text-text-muted">
              <span>{t("updateCount", { count: productUpdates.length })}</span>
            </div>
          </div>

          <div className="space-y-3">
            {updates.map((item) => {
              return <ProductUpdateCard key={item.id} item={item} />;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
