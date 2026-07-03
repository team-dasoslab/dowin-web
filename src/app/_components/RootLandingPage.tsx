"use client";

import { Footer } from "@/app/_components/Footer";
import { LandingHeader } from "@/app/_components/LandingHeader";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { Link } from "@/i18n/routing";
import { 
  Check, 
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Dowin",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Application",
    description: t("Hero.description") || "가장 중요한 목표에 집중하세요.",
    url: "https://dowin.app",
    author: {
      "@type": "Organization",
      name: "Dasoslab",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: t("Problem.item1Title"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("Problem.item1Body"),
        },
      },
      {
        "@type": "Question",
        name: t("Problem.item2Title"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("Problem.item2Body"),
        },
      },
      {
        "@type": "Question",
        name: t("Problem.item3Title"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("Problem.item3Body"),
        },
      },
      {
        "@type": "Question",
        name: t("Solution.item1Title"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("Solution.item1Body"),
        },
      },
    ],
  };

  return (
    <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative bg-white text-text-primary selection:bg-primary/20 selection:text-primary font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="absolute top-0 w-full z-50">
        <LandingHeader />
      </div>

      {/* Hero Section */}
      <section className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-[1200px] flex-col justify-center px-6 py-40 md:px-10 md:py-56 text-center items-center">
        <div className="absolute top-0 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[150px] opacity-80 -z-10 pointer-events-none" />
        
        {t("Hero.eyebrow") && (
          <FadeIn delay={0.1}>
            <p className="mb-6 text-[15px] font-bold tracking-widest text-primary bg-primary/10 px-5 py-2 rounded-full inline-block">
              {t("Hero.eyebrow")}
            </p>
          </FadeIn>
        )}
        <FadeIn delay={0.2}>
          <h1 className="whitespace-pre-line break-keep text-[48px] font-black leading-[1.25] tracking-tighter text-text-primary md:text-[72px] max-w-[1000px]">
            {t("Hero.headline")}
          </h1>
        </FadeIn>
        {t("Hero.description") && (
          <FadeIn delay={0.3}>
            <p className="mt-8 mx-auto max-w-[640px] whitespace-pre-line break-keep text-[20px] font-medium leading-[1.6] text-text-muted md:text-[24px]">
              {t("Hero.description")}
            </p>
          </FadeIn>
        )}
        <FadeIn delay={0.4}>
          <div className="mt-16 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              asChild
              variant="primary"
              size="lg"
            >
              <Link href="/login">{t("Hero.primaryCta")}</Link>
            </Button>
          </div>
        </FadeIn>
      </section>

      {/* Problem Section: Sticky Scroll */}
      <section className="bg-zinc-50 px-6 py-40 md:px-10 md:py-56">
        <div className="mx-auto max-w-[1200px] grid lg:grid-cols-[1fr_1.2fr] gap-20 items-start">
          {/* Sticky Sidebar */}
          <div className="lg:sticky lg:top-40 max-w-[600px]">
            <FadeIn>
              <h2 className="whitespace-pre-line break-keep text-[40px] font-black leading-[1.25] tracking-tighter text-text-primary md:text-[52px]">
                {t("Problem.title")}
              </h2>
            </FadeIn>
            {t("Problem.body") && (
              <FadeIn delay={0.1}>
                <p className="mt-8 whitespace-pre-line break-keep text-[18px] font-medium leading-[1.6] text-text-muted md:text-[22px]">
                  {t("Problem.body")}
                </p>
              </FadeIn>
            )}
          </div>

          {/* Scrolling Cards */}
          <div className="flex flex-col gap-8 md:gap-12">
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
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.title} delay={0.1 * i} distance={60}>
                  <div className="bg-white rounded-3xl p-8 md:p-12 flex flex-col justify-between">
                    <div>
                      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-text-primary">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="break-keep text-[24px] font-bold leading-[1.3] tracking-tight text-text-primary mb-6">{item.title}</h3>
                    </div>
                    <p className="break-keep text-[17px] font-medium leading-[1.6] text-text-muted">{item.body}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution Section: 2x2 Grid */}
      <section className="bg-white px-6 py-40 md:px-10 md:py-56">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-center mb-24 md:mb-32">
            <FadeIn>
              <h2 className="whitespace-pre-line break-keep text-[40px] font-black leading-[1.25] tracking-tighter text-text-primary md:text-[52px]">
                {t("Solution.title")}
              </h2>
            </FadeIn>
            {t("Solution.body") && (
              <FadeIn delay={0.1}>
                <p className="mt-8 whitespace-pre-line break-keep text-[18px] font-medium leading-[1.6] text-text-muted md:text-[22px]">
                  {t("Solution.body")}
                </p>
              </FadeIn>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {[
              { icon: Target, title: t("Solution.item1Title"), body: t("Solution.item1Body") },
              { icon: Flag, title: t("Solution.item2Title"), body: t("Solution.item2Body") },
              { icon: ClipboardCheck, title: t("Solution.item3Title"), body: t("Solution.item3Body") },
              { icon: BarChart3, title: t("Solution.item4Title"), body: t("Solution.item4Body") },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.title} delay={0.1 * i} distance={40}>
                  <div className="bg-zinc-50/50 hover:bg-zinc-50 transition-colors duration-500 rounded-3xl p-8 md:p-12 flex flex-col justify-between h-full">
                    <div>
                      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="break-keep text-[24px] font-bold leading-[1.3] tracking-tight text-text-primary mb-6">{item.title}</h3>
                    </div>
                    <p className="break-keep text-[17px] font-medium leading-[1.6] text-text-muted">{item.body}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Loop Section */}
      <section id="loop" className="bg-primary/5 px-6 py-40 md:px-10 md:py-56 text-center overflow-hidden">
        <div className="mx-auto max-w-[1000px]">
          {t("Loop.eyebrow") && (
            <FadeIn>
              <p className="mb-6 text-[15px] font-bold tracking-widest text-primary uppercase">{t("Loop.eyebrow")}</p>
            </FadeIn>
          )}
          <FadeIn delay={0.1}>
            <h2 className="whitespace-pre-line break-keep text-[40px] font-black leading-[1.25] tracking-tighter text-text-primary md:text-[52px] mb-24">
              {t("Loop.title")}
            </h2>
          </FadeIn>
          
          <FadeIn delay={0.2} distance={80}>
            <div className="relative mx-auto w-[280px] h-[280px] md:w-[500px] md:h-[500px] mt-40 md:mt-48 mb-32">
              {/* Continuous SVG Circle */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                  {/* Continuous SVG Circle with mathematically calculated dash array to leave 16px gaps at exactly 0, 90, 180, and 270 degrees (compensating for round linecaps) */}
                  <circle cx="100" cy="100" r="100" fill="none" stroke="currentColor" className="text-zinc-900/20" strokeWidth="2" strokeLinecap="round" strokeDashoffset="-8" strokeDasharray="3 9.55 3 9.55 3 9.55 3 9.55 3 9.55 3 9.55 3 9.55 3 9.55 3 9.55 3 9.55 3 9.55 3 16" />
                  
                  {/* Arrows indicating clockwise direction, perfectly rotated around center */}
                  <path d="M 96 -6 L 104 0 L 96 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900/20" />
                  <path d="M 96 -6 L 104 0 L 96 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900/20" transform="rotate(90 100 100)" />
                  <path d="M 96 -6 L 104 0 L 96 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900/20" transform="rotate(180 100 100)" />
                  <path d="M 96 -6 L 104 0 L 96 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900/20" transform="rotate(270 100 100)" />
                </svg>
              </div>

              {/* Nodes on the circle (14.6% is 1 - 1/sqrt(2) to lie on the circle) */}
              {[
                { num: "1", node: 1, pos: "left-[14.6%] top-[14.6%]", textTop: true },
                { num: "2", node: 2, pos: "left-[85.4%] top-[14.6%]", textTop: true },
                { num: "3", node: 3, pos: "left-[85.4%] top-[85.4%]", textTop: false },
                { num: "4", node: 4, pos: "left-[14.6%] top-[85.4%]", textTop: false },
              ].map((item, i) => (
                <div key={i} className={`absolute ${item.pos} z-10`}>
                  {/* Offset container so the center of the 56x56 icon sits exactly at the anchor point */}
                  <div className={`absolute -left-[80px] md:-left-[140px] w-[160px] md:w-[280px] flex flex-col items-center text-center ${item.textTop ? '-bottom-[28px]' : '-top-[28px]'}`}>
                    {item.textTop ? (
                      <>
                        <h3 className="text-[18px] md:text-[22px] font-bold text-text-primary mb-3 md:mb-4 tracking-tight">
                          {t(`Loop.node${item.node}Title` as Parameters<typeof t>[0])}
                        </h3>
                        <p className="whitespace-pre-line text-[14px] md:text-[16px] font-medium text-zinc-600 break-keep leading-relaxed max-w-[240px] mb-4 md:mb-6">
                          {t(`Loop.node${item.node}Desc` as Parameters<typeof t>[0])}
                        </p>
                        <div className="text-[20px] font-bold text-white bg-zinc-900 w-14 h-14 shrink-0 flex items-center justify-center rounded-full ring-[10px] ring-white/50">
                          {item.num}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[20px] font-bold text-white mb-4 md:mb-6 bg-zinc-900 w-14 h-14 shrink-0 flex items-center justify-center rounded-full ring-[10px] ring-white/50">
                          {item.num}
                        </div>
                        <h3 className="text-[18px] md:text-[22px] font-bold text-text-primary mb-3 md:mb-4 tracking-tight">
                          {t(`Loop.node${item.node}Title` as Parameters<typeof t>[0])}
                        </h3>
                        <p className="whitespace-pre-line text-[14px] md:text-[16px] font-medium text-zinc-600 break-keep leading-relaxed max-w-[240px]">
                          {t(`Loop.node${item.node}Desc` as Parameters<typeof t>[0])}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-zinc-50 px-6 py-40 md:px-10 md:py-56">
        <div className="mx-auto max-w-[1000px] text-center">
          <FadeIn>
            <h2 className="whitespace-pre-line break-keep text-[40px] font-black leading-[1.25] tracking-tighter text-text-primary md:text-[52px]">
              {t("Pricing.title")}
            </h2>
          </FadeIn>
          {t("Pricing.body") && (
            <FadeIn delay={0.1}>
              <p className="mx-auto mt-8 max-w-[720px] whitespace-pre-line break-keep text-[18px] font-medium leading-[1.6] text-text-muted md:text-[22px]">
                {t("Pricing.body")}
              </p>
            </FadeIn>
          )}
          
          <FadeIn delay={0.2} distance={60}>
            <div className="mx-auto mt-24 max-w-[500px] bg-white p-12 md:p-14 rounded-3xl text-center">
              <h3 className="text-[18px] font-bold text-primary tracking-tight bg-primary/10 inline-block px-5 py-2 rounded-full mb-8">
                {t("Pricing.planName")}
              </h3>
              <div className="flex justify-center items-baseline gap-2">
                <span className="text-[56px] font-black leading-none tracking-tighter text-text-primary">{t("Pricing.price")}</span>
                <span className="text-[18px] font-medium text-text-muted">{t("Pricing.unit")}</span>
              </div>
              <ul className="mt-12 space-y-6 text-left inline-block w-full px-4">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center gap-5 text-zinc-700">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                    <span className="text-[17px] font-medium leading-relaxed">{t(`Pricing.feature${i}` as Parameters<typeof t>[0])}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="primary" size="lg" className="mt-14 w-full px-0">
                <Link href="/login">{t("Pricing.cta")}</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white px-6 py-40 md:px-10 md:py-56">
        <div className="mx-auto max-w-[1000px] text-center">
          <FadeIn>
            <h2 className="whitespace-pre-line break-keep text-[40px] font-black leading-[1.2] tracking-tighter text-text-primary md:text-[64px]">
              {t("FinalCta.title")}
            </h2>
          </FadeIn>
          {t("FinalCta.body") && (
            <FadeIn delay={0.1}>
              <p className="mx-auto mt-8 max-w-[720px] whitespace-pre-line break-keep text-[18px] font-medium leading-[1.6] text-text-muted md:text-[24px]">
                {t("FinalCta.body")}
              </p>
            </FadeIn>
          )}
          <FadeIn delay={0.2}>
            <div className="mt-16">
              <Button
                asChild
                variant="primary"
                size="lg"
                className="w-full sm:w-auto min-w-[280px] px-10 text-[20px]"
              >
                <Link href="/login">
                  {t("FinalCta.cta")}
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer className="bg-zinc-50" />
    </main>
  );
}
