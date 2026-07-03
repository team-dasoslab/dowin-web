"use client";

import Image from "next/image";

import { Logo } from "@/components/ui/Logo";
import { EXTERNAL_LINKS } from "@/config/links";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const t = useTranslations("Landing.Footer");
  const tCommon = useTranslations("Common");

  return (
    <footer className={`w-full px-6 py-16 ${className}`}>
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center gap-10 text-center">
        {/* Logo & Service Name */}
        <div className="flex items-center gap-2.5">
          <Logo size="24px" className="text-text-primary" />
          <span className="text-[18px] font-black tracking-tighter text-text-primary uppercase">
            {tCommon("serviceName")}
          </span>
        </div>

        {/* App Download Links */}
        <div className="flex flex-row items-center justify-center gap-4 mt-2">
          <a href={EXTERNAL_LINKS.APP_STORE} target="_blank" rel="noopener noreferrer">
            <Image src="/assets/store/appstore.png" alt="App Store" width={140} height={42} className="h-auto w-[120px]" unoptimized />
          </a>
          <a href={EXTERNAL_LINKS.PLAY_STORE} target="_blank" rel="noopener noreferrer">
            <Image src="/assets/store/playstore.png" alt="Google Play" width={140} height={42} className="h-auto w-[120px]" unoptimized />
          </a>
        </div>

        {/* Legal Links */}
        <div className="flex items-center gap-10 text-[14px] font-bold text-text-muted">
          <Link href="/privacy">
            {t("privacy")}
          </Link>
          <Link href="/terms">
            {t("terms")}
          </Link>
          <Link href="/billing-policy">
            {t("billingPolicy")}
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
          © 2026 Dasoslab. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
