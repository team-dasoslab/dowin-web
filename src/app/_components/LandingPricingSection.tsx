"use client";

import { useTranslations } from "next-intl";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";

const PLAN_KEYS = ["FREE", "STANDARD"] as const;

export function LandingPricingSection() {
  const t = useTranslations("Landing.Pricing");

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        <div className="mb-12 max-w-[760px] mx-auto text-center">
          <h2 className="text-[32px] leading-[1.15] font-black tracking-[-0.03em] text-zinc-900 md:text-[48px] break-keep whitespace-pre-line">
            {t("header")}
          </h2>
          <p className="mt-5 text-[17px] leading-[1.7] text-zinc-500 md:text-[19px] break-keep font-medium">
            {t("description")}
          </p>
        </div>

        <div className="mx-auto grid gap-6 lg:grid-cols-[1.05fr_0.95fr] max-w-[960px]">
          {PLAN_KEYS.map((planKey) => {
            const isFree = planKey === "FREE";
            const planT = (key: string) => t(`plans.${planKey}.${key}`);
            
            // Get features array from translations
            // next-intl doesn't support arrays directly easily, but we can use raw or map
            // Actually, we defined them as arrays in JSON. 
            // useTranslations does not support arrays, but we can use .raw() or just iterate if we know the count.
            // Since we have 5 features for each, I'll use a fixed loop or better, use the raw data.
            
            // To be safe and clean, I'll use a count or mapping.
            const features = [
              planT("features.0"),
              planT("features.1"),
              planT("features.2"),
              planT("features.3"),
              planT("features.4"),
            ];

            return (
              <div
                key={planKey}
                className={`flex flex-col rounded-[24px] border p-8 lg:p-10 ${
                  isFree
                    ? "border-zinc-200 bg-white"
                    : "border-zinc-100 bg-zinc-50/50"
                }`}
              >
                <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <p
                      className={`mb-2 text-[12px] font-bold uppercase tracking-wider ${
                        isFree ? "text-primary" : "text-zinc-400"
                      }`}
                    >
                      {planT("eyebrow")}
                    </p>
                    <h3
                      className={`text-[28px] font-black tracking-tight ${
                        isFree ? "text-zinc-900" : "text-zinc-400"
                      }`}
                    >
                      {planKey}
                    </h3>
                  </div>
                </div>

                <div className="mb-6 flex items-end gap-2">
                  <span
                    className={`text-[36px] font-black leading-none tracking-tighter ${
                      isFree ? "text-zinc-900" : "text-zinc-300"
                    }`}
                  >
                    {planT("price")}
                  </span>
                  {isFree && (
                    <span className="pb-1.5 text-sm font-bold text-zinc-500">
                      {t("cadence")}
                    </span>
                  )}
                </div>

                <p
                  className={`mb-8 text-[15px] leading-[1.65] font-medium break-keep ${
                    isFree ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  {planT("description")}
                </p>

                <div className="mb-10 space-y-3">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          isFree
                            ? "bg-primary/20 text-primary"
                            : "bg-zinc-200 text-zinc-400"
                        }`}
                      >
                        <DowinIcon name="status-checkmark" size="12px" />
                      </div>
                      <p
                        className={`text-[15px] leading-[1.5] font-medium break-keep ${
                          isFree ? "text-zinc-700" : "text-zinc-400"
                        }`}
                      >
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4">
                  {isFree ? (
                    <Button
                      asChild
                      className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-zinc-900 px-6 text-[15px] font-bold text-white transition-none"
                    >
                      <Link href="/login">{t("ctaFree")}</Link>
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-zinc-100 px-6 text-[15px] font-bold text-zinc-400 transition-none"
                    >
                      {t("ctaStandard")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
