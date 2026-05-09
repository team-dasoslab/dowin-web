"use client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { DowinIcon } from "@/components/ui/DowinIcon";

type Locale = "ko" | "en";

const COPY: Record<
  Locale,
  {
    badge: string;
    title: string;
    description: string;
    goHome: string;
    info: string;
  }
> = {
  ko: {
    badge: "404 NOT FOUND",
    title: "찾으시는 페이지가 없습니다",
    description:
      "주소가 바뀌었거나, 삭제되었거나, 잘못 입력되었을 수 있습니다.",
    goHome: "홈으로 이동",
    info: "계속 같은 문제가 보이면 경로 구조와 locale 라우팅 설정을 함께 확인하세요.",
  },
  en: {
    badge: "404 NOT FOUND",
    title: "Page not found",
    description:
      "The address may be wrong, changed, or the page may have been removed.",
    goHome: "Go home",
    info: "If this keeps happening, check the route structure and locale routing setup.",
  },
};

export function NotFoundPage({
  locale,
  homeHref,
}: {
  locale: Locale;
  homeHref: string;
}) {
  const copy = COPY[locale];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background ">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(94,106,210,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(132,204,22,0.14),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
        <Card className="card-dowin w-full max-w-xl animate-dowin-in rounded-[28px] border border-border/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <Badge className="rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-[10px] font-bold text-primary">
                {copy.badge}
              </Badge>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Dowin
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                {copy.title}
              </h1>
              <p className="max-w-md text-sm leading-6 text-text-secondary sm:text-base">
                {copy.description}
              </p>
            </div>

            <Button
              asChild
              className="btn-dowin-primary flex items-center justify-center gap-2 px-5 py-3 text-sm"
            >
              <Link href={homeHref}>
                <DowinIcon name="nav-home" size="16px" />
                {copy.goHome}
              </Link>
            </Button>

            <div className="rounded-2xl border border-dashed border-border bg-sub-background/80 px-4 py-3 text-xs leading-5 text-text-muted">
              {copy.info}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
