"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { productUpdates } from "@/content/product-updates";
import {
  getLatestMajorProductUpdate,
  getProductUpdates,
} from "@/lib/product-updates";
import { Calendar } from "lucide-react";
import Link from "next/link";

export default function UpdatesPage() {
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
          <p className="text-xs text-text-muted">새 기능 모아보기</p>
          <div className="w-8" />
        </header>

        <Card className="overflow-hidden rounded-lg border border-border">
          <div className="relative bg-[linear-gradient(135deg,rgba(49,81,255,0.10),rgba(255,255,255,0.96)_55%,rgba(49,81,255,0.04))] px-5 py-5 sm:px-6">
            <div className="max-w-[84%] space-y-3">
              <div>
                <Badge className="w-fit rounded-md border border-primary/15 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  추천 기능
                </Badge>
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold tracking-tight text-text-primary">
                  {latestMajorUpdate.title}
                </h1>
                <p className="max-w-[520px] text-sm leading-6 text-text-secondary">
                  {latestMajorUpdate.summary}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] leading-none text-text-muted">
                <Calendar className="h-3 w-3" />
                <span>{latestMajorUpdate.publishedAt}</span>
                <span className="text-border">•</span>
                <span>{latestMajorUpdate.tag}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  asChild
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90"
                >
                  <Link href={latestMajorUpdate.ctaHref}>
                    {latestMajorUpdate.ctaLabel}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                최근 추가된 기능
              </h2>
              <p className="text-[11px] text-text-muted">
                좋아진 점을 빠르게 훑고 바로 써볼 수 있게 모아뒀습니다.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-[11px] text-text-muted">
              <span>{productUpdates.length}개 업데이트</span>
            </div>
          </div>

          <div className="space-y-3">
            {updates.map((item) => {
              return (
                <Card
                  key={item.id}
                  className="rounded-lg border border-border px-4 py-4"
                >
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
                        <h3 className="text-sm font-bold text-text-primary">
                          {item.title}
                        </h3>
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
                      <Link
                        href={item.ctaHref}
                        className="flex items-center justify-center"
                      >
                        <span>{item.ctaLabel}</span>
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
