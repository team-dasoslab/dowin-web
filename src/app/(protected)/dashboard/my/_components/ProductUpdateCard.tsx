import type { ProductUpdate } from "@/content/product-updates";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Calendar, X } from "lucide-react";
import Link from "next/link";

interface ProductUpdateCardProps {
  onDismiss: () => void;
  update: ProductUpdate;
}

export function ProductUpdateCard({
  onDismiss,
  update,
}: ProductUpdateCardProps) {
  return (
    <Card className="overflow-hidden rounded-lg border border-border">
      <div className="relative bg-[linear-gradient(135deg,rgba(49,81,255,0.10),rgba(255,255,255,0.96)_55%,rgba(49,81,255,0.04))] px-4 py-4 sm:px-5">
        <Button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md border border-white/70 bg-white/80 text-text-muted hover:text-text-primary"
          aria-label="이 업데이트 잠시 숨기기"
        >
          <X className="h-3.5 w-3.5" />
        </Button>

        <div className="space-y-2.5 pr-10 sm:max-w-[84%] sm:pr-0">
          <div>
            <span className="inline-flex w-fit rounded-md border border-primary/15 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              새로운 기능 안내
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-text-primary">
              {update.title}
            </h2>
            <p className="max-w-[520px] text-[13px] leading-5 text-text-secondary">
              {update.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] leading-none text-text-muted">
            <Calendar className="h-3 w-3" />
            <span>{update.publishedAt}</span>
            <span className="text-border">•</span>
            <span>{update.tag}</span>
          </div>

          <div className="flex flex-row flex-wrap items-center gap-2 pt-0.5">
            <Button
              asChild
              className="justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90"
            >
              <Link href={update.ctaHref}>{update.ctaLabel}</Link>
            </Button>
            <Button
              asChild
              className="justify-center rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary"
            >
              <Link href="/updates">새 기능 모아보기</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
