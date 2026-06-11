"use client";

import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function LandingHeader() {
  const t = useTranslations("Landing");
  const tCommon = useTranslations("Common");

  return (
    <header className="fixed top-0 z-50 h-16 w-full bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 md:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <p className="text-[22px] font-black tracking-tight text-zinc-900 uppercase">
            {tCommon("serviceName")}
          </p>
        </Link>
        <div className="flex items-center gap-6">
          <Button
            asChild
            className="flex h-10 items-center justify-center rounded-button bg-primary px-6 text-[15px] font-bold text-white leading-none"
          >
            <Link href="/login">
              {t("Navigation.login")}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
