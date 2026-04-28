"use client";

import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function LandingHeader() {
  const t = useTranslations("Landing");
  const tCommon = useTranslations("Common");

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-white/70 px-4 md:px-8 xl:px-12 backdrop-blur-xl border-b border-slate-200/50">
      <Link href="/" className="flex items-center gap-2.5">
        <Logo />
        <p className="text-[22px] font-black tracking-tight text-slate-900 uppercase">
          {tCommon("serviceName")}
        </p>
      </Link>
      <div className="flex items-center gap-6">
        <Link
          href="/login"
          className="hidden sm:flex h-10 items-center text-[15px] font-bold text-slate-500 leading-none"
        >
          {t("Navigation.login")}
        </Link>
        <Button
          asChild
          className="flex h-10 items-center justify-center rounded-full bg-primary px-6 text-[15px] font-bold text-white leading-none"
        >
          <Link href="/login">
            {t("Navigation.start")}
          </Link>
        </Button>
      </div>
    </header>
  );
}
