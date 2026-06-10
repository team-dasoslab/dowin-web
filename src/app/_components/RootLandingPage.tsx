"use client";

import { Footer } from "@/components/layout/Footer";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

export function RootLandingPage() {
  const t = useTranslations("Landing");

  return (
    <main className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-white text-zinc-950 selection:bg-primary/20 selection:text-zinc-950">
      <LandingHeader />

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1120px] flex-col justify-center px-6 py-24 md:px-10 md:py-32">
        <div className="max-w-[860px]">
          {t("Hero.eyebrow") && (
            <p className="mb-6 text-[15px] font-bold text-primary">
              {t("Hero.eyebrow")}
            </p>
          )}
          <h1 className="whitespace-pre-line break-keep text-[44px] font-black leading-[1.08] tracking-tight text-zinc-950 md:text-[76px]">
            {t("Hero.headline")}
          </h1>
          {t("Hero.description") && (
            <p className="mt-8 max-w-[680px] whitespace-pre-line break-keep text-[18px] font-medium leading-[1.7] text-zinc-600 md:text-[22px]">
              {t("Hero.description")}
            </p>
          )}

        </div>
      </section>

      <TextSection
        eyebrow={t("Problem.eyebrow")}
        title={t("Problem.title")}
        body={t("Problem.body")}
        items={[
          {
            title: t("Problem.item1Title"),
            body: t("Problem.item1Body"),
          },
          {
            title: t("Problem.item2Title"),
            body: t("Problem.item2Body"),
          },
          {
            title: t("Problem.item3Title"),
            body: t("Problem.item3Body"),
          },
          {
            title: t("Problem.item4Title"),
            body: t("Problem.item4Body"),
          },
        ]}
      />

      <TextSection
        eyebrow={t("Solution.eyebrow")}
        title={t("Solution.title")}
        body={t("Solution.body")}
        items={[
          {
            title: t("Solution.item1Title"),
            body: t("Solution.item1Body"),
          },
          {
            title: t("Solution.item2Title"),
            body: t("Solution.item2Body"),
          },
          {
            title: t("Solution.item3Title"),
            body: t("Solution.item3Body"),
          },
          {
            title: t("Solution.item4Title"),
            body: t("Solution.item4Body"),
          },
        ]}
      />

      <section
        id="flow"
        className="border-y border-zinc-200 bg-zinc-950 px-6 py-24 text-white md:px-10 md:py-32"
      >
        <div className="mx-auto max-w-[1120px]">
          <p className="mb-4 text-[14px] font-bold text-primary">
            {t("Proof.eyebrow")}
          </p>
          <h2 className="max-w-[780px] whitespace-pre-line break-keep text-[36px] font-black leading-[1.16] tracking-tight md:text-[56px]">
            {t("Proof.title")}
          </h2>
          {t("Proof.body") && (
            <p className="mt-6 max-w-[680px] whitespace-pre-line break-keep text-[17px] font-medium leading-[1.7] text-zinc-300 md:text-[20px]">
              {t("Proof.body")}
            </p>
          )}

          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {[
              t("Proof.point1"),
              t("Proof.point2"),
              t("Proof.point3"),
              t("Proof.point4"),
            ].map((point) => (
              <p
                key={point}
                className="border-t border-white/15 pt-5 text-[18px] font-bold leading-[1.55] text-white md:text-[22px]"
              >
                {point}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-[14px] font-bold text-primary">
              {t("Flow.eyebrow")}
            </p>
            <h2 className="whitespace-pre-line break-keep text-[36px] font-black leading-[1.16] tracking-tight text-zinc-950 md:text-[56px]">
              {t("Flow.title")}
            </h2>
          </div>
          <div className="relative mt-12 w-full max-w-[800px] mx-auto lg:mt-0">
            {/* Background Circle Track */}
            <div className="absolute inset-x-[15%] inset-y-[15%] md:inset-x-[20%] md:inset-y-[20%] rounded-full border-[3px] border-dashed border-zinc-200" />
            
            <div className="relative grid grid-cols-2 gap-8 md:gap-24">
              {/* Node 01 - Top Left */}
              <div className="flex flex-col items-center text-center bg-white p-4 rounded-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-[18px] font-black text-white shadow-sm mb-4">
                  01
                </div>
                <h3 className="text-[18px] md:text-[22px] font-bold text-zinc-900 mb-2">
                  {t("Flow.node1Title")}
                </h3>
                <p className="text-[14px] md:text-[16px] font-medium text-zinc-500 break-keep">
                  {t("Flow.node1Desc")}
                </p>
              </div>

              {/* Node 02 - Top Right */}
              <div className="flex flex-col items-center text-center bg-white p-4 rounded-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-[18px] font-black text-white shadow-sm mb-4">
                  02
                </div>
                <h3 className="text-[18px] md:text-[22px] font-bold text-zinc-900 mb-2">
                  {t("Flow.node2Title")}
                </h3>
                <p className="text-[14px] md:text-[16px] font-medium text-zinc-500 break-keep">
                  {t("Flow.node2Desc")}
                </p>
              </div>

              {/* Node 04 - Bottom Left */}
              <div className="flex flex-col items-center text-center bg-white p-4 rounded-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-[18px] font-black text-white shadow-sm mb-4">
                  04
                </div>
                <h3 className="text-[18px] md:text-[22px] font-bold text-zinc-900 mb-2">
                  {t("Flow.node4Title")}
                </h3>
                <p className="text-[14px] md:text-[16px] font-medium text-zinc-500 break-keep">
                  {t("Flow.node4Desc")}
                </p>
              </div>

              {/* Node 03 - Bottom Right */}
              <div className="flex flex-col items-center text-center bg-white p-4 rounded-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-[18px] font-black text-white shadow-sm mb-4">
                  03
                </div>
                <h3 className="text-[18px] md:text-[22px] font-bold text-zinc-900 mb-2">
                  {t("Flow.node3Title")}
                </h3>
                <p className="text-[14px] md:text-[16px] font-medium text-zinc-500 break-keep">
                  {t("Flow.node3Desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1120px] text-center">
          <p className="mb-4 text-[14px] font-bold text-primary">
            {t("Pricing.eyebrow")}
          </p>
          <h2 className="whitespace-pre-line break-keep text-[36px] font-black leading-[1.16] tracking-tight text-zinc-950 md:text-[56px]">
            {t("Pricing.title")}
          </h2>
          <p className="mx-auto mt-6 max-w-[680px] whitespace-pre-line break-keep text-[17px] font-medium leading-[1.7] text-zinc-600 md:text-[20px]">
            {t("Pricing.body")}
          </p>
          
          <div className="mx-auto mt-16 max-w-[480px] rounded-3xl border border-zinc-200 bg-white p-8 text-left shadow-sm md:p-10">
            <h3 className="text-[20px] font-bold text-zinc-950">
              {t("Pricing.planName")}
            </h3>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-[44px] font-black leading-none tracking-tight text-zinc-950">
                {t("Pricing.price")}
              </span>
              <span className="mb-1 text-[16px] font-medium text-zinc-500">
                {t("Pricing.unit")}
              </span>
            </div>
            
            <ul className="mt-8 space-y-4">
              {[
                t("Pricing.feature1"),
                t("Pricing.feature2"),
                t("Pricing.feature3"),
                t("Pricing.feature4"),
              ].map((feature, i) => (
                <li key={i} className="flex gap-3 text-zinc-600">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-[16px] font-medium leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              className="mt-10 h-14 w-full rounded-xl text-[17px] font-bold"
            >
              <Link href="/login">{t("Pricing.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="whitespace-pre-line break-keep text-[38px] font-black leading-[1.12] tracking-tight text-zinc-950 md:text-[64px]">
            {t("FinalCta.title")}
          </h2>
          {t("FinalCta.body") && (
            <p className="mx-auto mt-6 max-w-[620px] whitespace-pre-line break-keep text-[18px] font-medium leading-[1.7] text-zinc-600 md:text-[20px]">
              {t("FinalCta.body")}
            </p>
          )}
          <div className="mt-10">
            <Button
              asChild
              className="h-14 rounded-xl bg-zinc-950 px-8 text-[17px] font-bold text-white"
            >
              <Link href="/login" className="text-white">
                {t("FinalCta.cta")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer className="border-t border-border" />
    </main>
  );
}

type TextSectionItem = {
  title: string;
  body: string;
};

function TextSection({
  eyebrow,
  title,
  body,
  items,
}: {
  eyebrow: string;
  title: string;
  body: string;
  items: TextSectionItem[];
}) {
  return (
    <section className="border-t border-zinc-200 px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1120px]">
        <div className="max-w-[760px]">
          <p className="mb-4 text-[14px] font-bold text-primary">{eyebrow}</p>
          <h2 className="whitespace-pre-line break-keep text-[36px] font-black leading-[1.16] tracking-tight text-zinc-950 md:text-[56px]">
            {title}
          </h2>
          {body && (
            <p className="mt-6 whitespace-pre-line break-keep text-[17px] font-medium leading-[1.7] text-zinc-600 md:text-[20px]">
              {body}
            </p>
          )}
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="border-t border-zinc-200 pt-6">
              <h3 className="break-keep text-[24px] font-black leading-tight text-zinc-950">
                {item.title}
              </h3>
              <p className="mt-3 break-keep text-[16px] font-medium leading-[1.65] text-zinc-600">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
