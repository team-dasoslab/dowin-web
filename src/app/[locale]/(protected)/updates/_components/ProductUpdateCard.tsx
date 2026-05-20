"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ProductUpdate } from "@/content/product-updates";
import { Link } from "@/i18n/routing";

type ProductUpdateCardProps = {
  item: ProductUpdate & {
    isNew: boolean;
  };
};

import { useTranslations } from "next-intl";

export function ProductUpdateCard({ item }: ProductUpdateCardProps) {
  const t = useTranslations("ProductUpdates");
  return (
    <Card className="rounded-content border border-border px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-button border border-border bg-sub-background px-2 py-1 text-[10px] font-bold text-text-secondary">
              {t(`tags.${item.tag}`)}
            </Badge>
            {item.isNew ? (
              <Badge className="rounded-button border border-primary/15 bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary">
                NEW
              </Badge>
            ) : null}
            {item.plan === "STANDARD" ? (
              <Badge className="rounded-button border border-primary/15 bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary">
                {t("standardOnly")}
              </Badge>
            ) : null}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-primary">
              {t(`updates.${item.id}.title`)}
            </h3>
            <p className="text-[13px] leading-6 text-text-secondary">
              {t(`updates.${item.id}.summary`)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] leading-none text-text-muted">
            {item.publishedAt}
          </div>
        </div>

        <Button
          asChild
          className="shrink-0 self-start rounded-button border border-border bg-white px-3 py-2 text-xs font-bold text-text-secondary sm:self-auto"
        >
          <Link
            href={item.ctaHref}
            className="flex items-center justify-center"
          >
            <span>{t("ctaLabel")}</span>
          </Link>
        </Button>
      </div>
    </Card>
  );
}
