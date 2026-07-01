"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
    <div className="rounded-[24px] bg-surface p-5" radius="xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="ghost-secondary" size="lg">
              {t(`tags.${item.tag}`)}
            </Badge>
            {item.isNew ? (
              <Badge variant="ghost-primary" size="lg">
                NEW
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
          variant="subtle"
          size="sm"
          className="shrink-0 self-start sm:self-auto rounded-[12px] hover:bg-border"
        >
          <Link
            href={item.ctaHref}
            className="flex items-center justify-center"
          >
            <span>{t("ctaLabel")}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
