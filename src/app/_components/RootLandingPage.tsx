"use client";

import Image from "next/image";

import { Footer } from "@/components/layout/Footer";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { 
  Check, 
  ArrowRight,
  ListChecks,
  Target,
  ClipboardCheck,
  MessageSquareWarning,
  Flag,
  BarChart3
} from "lucide-react";
import { useTranslations } from "next-intl";

export function RootLandingPage() {
  const t = useTranslations("Landing");

  return (
    <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative bg-zinc-50 text-zinc-900 selection:bg-primary/20 selection:text-primary font-sans">
      <div className="absolute top-0 w-full z-50">
        <LandingHeader />
      </div>

      {/* Hero Section */}
      <section className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-[1200px] flex-col justify-center px-6 py-32 md:px-10 md:py-48 text-center items-center">
        <div className="absolute top-0 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[150px] opacity-60 -z-10 pointer-events-none" />
        
        {t("Hero.eyebrow") && (
          <p className="mb-6 text-[15px] font-bold tracking-widest text-primary bg-primary/10 px-5 py-2 rounded-button inline-block">
            {t("Hero.eyebrow")}
          </p>
        )}
        <h1 className="whitespace-pre-line break-keep text-[52px] font-bold leading-[1.3] tracking-tight text-zinc-900 md:text-[80px] max-w-[900px]">
          {t("Hero.headline")}
        </h1>
        {t("Hero.description") && (
          <p className="mt-8 max-w-[640px] whitespace-pre-line break-keep text-[20px] font-medium leading-[1.6] text-zinc-600 md:text-[24px]">
            {t("Hero.description")}
          </p>
        )}
        <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            asChild
            className="h-14 rounded-button bg-primary px-10 text-[17px] font-bold text-white"
          >
            <Link href="/login">{t("Hero.primaryCta")}</Link>
          </Button>
        </div>
      </section>

      {/* Problem Section: Sticky Scroll */}
      <section className="bg-white px-6 py-32 md:px-10 md:py-48">
        <div className="mx-auto max-w-[1200px] grid lg:grid-cols-[1fr_1.2fr] gap-20 items-start">
          {/* Sticky Sidebar */}
          <div className="lg:sticky lg:top-40 max-w-[600px]">
            <h2 className="whitespace-pre-line break-keep text-[40px] font-bold leading-[1.3] tracking-tight text-zinc-900 md:text-[56px]">
              {t("Problem.title")}
            </h2>
            {t("Problem.body") && (
              <p className="mt-6 whitespace-pre-line break-keep text-[18px] font-medium leading-[1.6] text-zinc-600 md:text-[22px]">
                {t("Problem.body")}
              </p>
            )}
          </div>

          {/* Scrolling Cards */}
          <div className="flex flex-col gap-6 md:gap-8">
            {[
              {
                icon: ListChecks,
                title: t("Problem.item1Title"),
                body: t("Problem.item1Body"),
              },
              {
                icon: Target,
                title: t("Problem.item2Title"),
                body: t("Problem.item2Body"),
              },
              {
                icon: ClipboardCheck,
                title: t("Problem.item3Title"),
                body: t("Problem.item3Body"),
              },
              {
                icon: MessageSquareWarning,
                title: t("Problem.item4Title"),
                body: t("Problem.item4Body"),
              },
            ].map((item: any, i: number) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-zinc-50 rounded-2xl p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white text-zinc-900">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="break-keep text-[24px] font-bold leading-[1.4] tracking-tight text-zinc-900 mb-4">{item.title}</h3>
                  </div>
                  <p className="break-keep text-[17px] font-medium leading-[1.6] text-zinc-600">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution Section: 2x2 Grid */}
      <section className="bg-zinc-50 px-6 py-32 md:px-10 md:py-48">
        <div className="mx-auto max-w-[1000px]">
          <div className="text-center mb-24">
            <h2 className="whitespace-pre-line break-keep text-[40px] font-bold leading-[1.3] tracking-tight text-zinc-900 md:text-[56px]">
              {t("Solution.title")}
            </h2>
            {t("Solution.body") && (
              <p className="mt-6 whitespace-pre-line break-keep text-[18px] font-medium leading-[1.6] text-zinc-600 md:text-[22px]">
                {t("Solution.body")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {[
              { icon: Target, title: t("Solution.item1Title"), body: t("Solution.item1Body") },
              { icon: Flag, title: t("Solution.item2Title"), body: t("Solution.item2Body") },
              { icon: ClipboardCheck, title: t("Solution.item3Title"), body: t("Solution.item3Body") },
              { icon: BarChart3, title: t("Solution.item4Title"), body: t("Solution.item4Body") },
            ].map((item: any, i: number) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white rounded-2xl p-8 md:p-10 flex flex-col justify-between">
                  <div>
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="break-keep text-[24px] font-bold leading-[1.4] tracking-tight text-zinc-900 mb-4">{item.title}</h3>
                  </div>
                  <p className="break-keep text-[17px] font-medium leading-[1.6] text-zinc-600">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Loop Section */}
      <section id="loop" className="bg-white px-6 py-32 md:px-10 md:py-48 text-center">
        <div className="mx-auto max-w-[1000px]">
          {t("Loop.eyebrow") && <p className="mb-4 text-[15px] font-bold tracking-widest text-primary uppercase">{t("Loop.eyebrow")}</p>}
          <h2 className="whitespace-pre-line break-keep text-[40px] font-bold leading-[1.3] tracking-tight text-zinc-900 md:text-[56px] mb-24">
            {t("Loop.title")}
          </h2>
          
          <div className="relative mx-auto w-[280px] h-[280px] md:w-[500px] md:h-[500px] mt-24 mb-32">
            {/* Continuous SVG Circle */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                <circle cx="100" cy="100" r="100" fill="none" stroke="currentColor" className="text-zinc-200" strokeWidth="2" strokeDasharray="4 6" />
              </svg>
            </div>

            {/* Nodes on the circle (14.6% is 1 - 1/sqrt(2) to lie on the circle) */}
            {[
              { num: "1", node: 1, pos: "left-[14.6%] top-[14.6%]" },
              { num: "2", node: 2, pos: "left-[85.4%] top-[14.6%]" },
              { num: "3", node: 3, pos: "left-[85.4%] top-[85.4%]" },
              { num: "4", node: 4, pos: "left-[14.6%] top-[85.4%]" },
            ].map((item, i) => (
              <div key={i} className={`absolute ${item.pos} z-10`}>
                {/* Offset container so the center of the 56x56 icon sits exactly at the anchor point */}
                <div className="absolute -left-[80px] md:-left-[140px] -top-[28px] w-[160px] md:w-[280px] flex flex-col items-center text-center">
                  <div className="text-[20px] font-bold text-white mb-4 md:mb-6 bg-zinc-900 w-14 h-14 flex items-center justify-center rounded-full ring-[10px] ring-white">
                    {item.num}
                  </div>
                  <h3 className="text-[18px] md:text-[24px] font-bold text-zinc-900 mb-2 md:mb-3 tracking-tight">
                    {t(`Loop.node${item.node}Title` as any)}
                  </h3>
                  <p className="text-[14px] md:text-[15px] font-medium text-zinc-600 break-keep leading-relaxed max-w-[240px]">
                    {t(`Loop.node${item.node}Desc` as any)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-zinc-50 px-6 py-32 md:px-10 md:py-48">
        <div className="mx-auto max-w-[1000px] text-center">
          <h2 className="whitespace-pre-line break-keep text-[40px] font-bold leading-[1.3] tracking-tight text-zinc-900 md:text-[56px]">
            {t("Pricing.title")}
          </h2>
          {t("Pricing.body") && (
            <p className="mx-auto mt-6 max-w-[720px] whitespace-pre-line break-keep text-[18px] font-medium leading-[1.6] text-zinc-600 md:text-[22px]">
              {t("Pricing.body")}
            </p>
          )}
          
          <div className="mx-auto mt-20 max-w-[480px] bg-white p-10 md:p-12 rounded-2xl text-center">
            <h3 className="text-[18px] font-bold text-primary tracking-tight bg-primary/10 inline-block px-4 py-1.5 rounded-button mb-6">
              {t("Pricing.planName")}
            </h3>
            <div className="flex justify-center items-baseline gap-2">
              <span className="text-[56px] font-bold leading-none tracking-tight text-zinc-900">{t("Pricing.price")}</span>
              <span className="text-[18px] font-medium text-zinc-500">{t("Pricing.unit")}</span>
            </div>
            <ul className="mt-10 space-y-5 text-left inline-block w-full px-4">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-4 text-zinc-700">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </div>
                  <span className="text-[17px] font-medium leading-relaxed">{t(`Pricing.feature${i}` as any)}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-12 h-14 w-full rounded-button bg-primary text-[17px] font-bold text-white">
              <Link href="/login">{t("Pricing.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white px-6 py-40 md:px-10 md:py-56">
        <div className="mx-auto max-w-[1000px] text-center">
          <h2 className="whitespace-pre-line break-keep text-[44px] font-bold leading-[1.3] tracking-tight text-zinc-900 md:text-[64px]">
            {t("FinalCta.title")}
          </h2>
          {t("FinalCta.body") && (
            <p className="mx-auto mt-6 max-w-[720px] whitespace-pre-line break-keep text-[18px] font-medium leading-[1.6] text-zinc-600 md:text-[24px]">
              {t("FinalCta.body")}
            </p>
          )}
          <div className="mt-14">
            <Button
              asChild
              className="h-14 w-full sm:w-auto min-w-[240px] rounded-button bg-primary px-8 text-[17px] font-bold text-white shadow-sm"
            >
              <Link href="/login" className="text-white">
                {t("FinalCta.cta")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer className="bg-zinc-50" />
    </main>
  );
}
