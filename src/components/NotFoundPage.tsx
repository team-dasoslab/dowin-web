"use client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";

type Locale = "ko" | "en";

const COPY: Record<
  Locale,
  {
    badge: string;
    title: string;
    description: string;
    goHome: string;
  }
> = {
  ko: {
    badge: "404 NOT FOUND",
    title: "찾으시는 페이지가 없습니다",
    description:
      "주소가 바뀌었거나, 삭제되었거나, 잘못 입력되었을 수 있습니다.",
    goHome: "홈으로 이동",
  },
  en: {
    badge: "404 NOT FOUND",
    title: "Page not found",
    description:
      "The address may be wrong, changed, or the page may have been removed.",
    goHome: "Go home",
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
    <main className="min-h-screen relative flex items-center justify-center bg-zinc-100 px-4 py-12 overflow-y-auto selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>

      <Card className="w-full max-w-[480px] bg-white border-none rounded-[24px] p-8 md:p-12 space-y-10 animate-dowin-in relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="w-16 h-16 bg-white border-none rounded-[16px] flex items-center justify-center shadow-sm">
              <Logo size="32px" className="text-zinc-900" />
            </div>
            <div className="text-[11px] font-black tracking-widest uppercase text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-full">
              {copy.badge}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-[24px] font-black tracking-tight text-zinc-900 leading-none">
              {copy.title}
            </h1>
            <div className="text-[15px] font-medium text-zinc-500 tracking-tight break-keep pt-1 leading-relaxed">
              {copy.description}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            asChild
            className="h-[56px] w-full flex items-center justify-center gap-3 rounded-[24px] text-[16px] font-black transition-colors active:scale-[0.98] bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <Link href={homeHref}>
              {copy.goHome}
            </Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
