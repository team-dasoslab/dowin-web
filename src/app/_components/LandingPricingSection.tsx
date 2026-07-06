"use client";

import { useTranslations } from "next-intl";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";

export function LandingPricingSection() {
  const t = useTranslations("Landing.Pricing");
  const features = [
    t("features.0"),
    t("features.1"),
    t("features.2"),
    t("features.3"),
    t("features.4"),
  ];

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        <div className="mb-12 max-w-[760px] mx-auto text-center">
          <h2 className="text-[32px] leading-[1.15] font-black tracking-[-0.03em] text-text-primary md:text-[48px] break-keep whitespace-pre-line">
            {t("header")}
          </h2>
          <p className="mt-5 text-[17px] leading-[1.7] text-text-muted md:text-[19px] break-keep font-medium">
            {t("description")}
          </p>
        </div>

        <div className="mx-auto max-w-[560px]">
          <div className="flex flex-col rounded-[24px] border border-zinc-200 bg-white p-8 lg:p-10">
            <div className="mb-8">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-primary">
                {t("eyebrow")}
              </p>
              <h3 className="text-[28px] font-black tracking-tight text-text-primary">
                Basic
              </h3>
            </div>

            <div className="mb-6 flex items-end gap-2">
              <span className="text-[36px] font-black leading-none tracking-tighter text-text-primary">
                {t("price")}
              </span>
              <span className="pb-1.5 text-sm font-bold text-text-muted">
                {t("cadence")}
              </span>
            </div>

            <p className="mb-8 break-keep text-[15px] font-medium leading-[1.65] text-zinc-600">
              {t("planDescription")}
            </p>

            <div className="mb-10 space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <DowinIcon name="status-checkmark" size="12px" />
                  </div>
                  <p className="break-keep text-[15px] font-medium leading-[1.5] text-zinc-700">
                    {feature}
                  </p>
                </div>
              ))}
            </div>

            <Button
              asChild
              variant="solid-dark"
              size="xl"
              className="w-full transition-none"
            >
              <Link href="/login">{t("cta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
