"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/routing";
import { Home } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <main className="relative min-h-screen overflow-hidden bg-background font-pretendard">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,106,210,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(132,204,22,0.14),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
        <Card className="card-linear w-full max-w-xl rounded-[28px] border border-border/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 animate-linear-in">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <Badge className="rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary">
                {t("badge")}
              </Badge>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                WIG
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                {t("title")}
              </h1>
              <p className="max-w-md text-sm leading-6 text-text-secondary sm:text-base">
                {t("description")}
              </p>
            </div>

            <Button
              asChild
              className="btn-linear-primary flex items-center justify-center gap-2 px-5 py-3 text-sm"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                {t("goHome")}
              </Link>
            </Button>

            <div className="rounded-2xl border border-dashed border-border bg-sub-background/80 px-4 py-3 text-xs leading-5 text-text-muted">
              {t("info")}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
