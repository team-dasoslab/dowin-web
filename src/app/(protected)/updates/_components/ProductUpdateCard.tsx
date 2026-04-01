"use client";

import type { ProductUpdate } from "@/content/product-updates";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Calendar } from "lucide-react";
import Link from "next/link";

type ProductUpdateCardProps = {
  item: ProductUpdate & {
    isNew: boolean;
  };
};

export function ProductUpdateCard({ item }: ProductUpdateCardProps) {
  return (
    <Card className="rounded-lg border border-border px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-md border border-border bg-sub-background px-2 py-1 text-[10px] font-bold text-text-secondary">
              {item.tag}
            </Badge>
            {item.isNew ? (
              <Badge className="rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary">
                NEW
              </Badge>
            ) : null}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
            <p className="text-[13px] leading-6 text-text-secondary">
              {item.summary}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] leading-none text-text-muted">
            <Calendar className="h-3 w-3" />
            {item.publishedAt}
          </div>
        </div>

        <Button
          asChild
          className="shrink-0 self-start rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary sm:self-auto"
        >
          <Link href={item.ctaHref} className="flex items-center justify-center">
            <span>{item.ctaLabel}</span>
          </Link>
        </Button>
      </div>
    </Card>
  );
}
