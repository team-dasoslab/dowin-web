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
        items={[1, 2, 3, 4].map((i) => ({
          title: t(`Problem.item${i}Title` as any),
          body: t(`Problem.item${i}Body` as any),
        }))}
      />

      <TextSection
        eyebrow={t("Solution.eyebrow")}
        title={t("Solution.title")}
        body={t("Solution.body")}
        items={[1, 2, 3, 4].map((i) => ({
          title: t(`Solution.item${i}Title` as any),
          body: t(`Solution.item${i}Body` as any),
        }))}
      />

      <section id="loop" className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-[14px] font-bold text-primary">
              {t("Loop.eyebrow")}
            </p>
            <h2 className="whitespace-pre-line break-keep text-[36px] font-black leading-[1.16] tracking-tight text-zinc-950 md:text-[56px]">
              {t("Loop.title")}
            </h2>
          </div>
          <div className="relative mt-16 w-full max-w-[900px] mx-auto lg:mt-0 flex items-center justify-center">
            {/* The Central Circular Arrows SVG */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="w-[240px] h-[240px] md:w-[460px] md:h-[460px] opacity-70 md:opacity-100">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md -rotate-45">
                  <defs>
                    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                    </marker>
                    <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                    </marker>
                    <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                    </marker>
                    <marker id="arrow-violet" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#8b5cf6" />
                    </marker>
                  </defs>
                  <g transform="translate(100, 100)">
                    {/* Node 1 to 2 (Top quadrant) */}
                    <g transform="rotate(-90)">
                      <path d="M 68.9 12.1 A 70 70 0 0 1 12.1 68.9" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" markerEnd="url(#arrow-blue)" />
                    </g>
                    {/* Node 2 to 3 (Right quadrant) */}
                    <g transform="rotate(0)">
                      <path d="M 68.9 12.1 A 70 70 0 0 1 12.1 68.9" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" markerEnd="url(#arrow-emerald)" />
                    </g>
                    {/* Node 3 to 4 (Bottom quadrant) */}
                    <g transform="rotate(90)">
                      <path d="M 68.9 12.1 A 70 70 0 0 1 12.1 68.9" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" markerEnd="url(#arrow-amber)" />
                    </g>
                    {/* Node 4 to 1 (Left quadrant) */}
                    <g transform="rotate(180)">
                      <path d="M 68.9 12.1 A 70 70 0 0 1 12.1 68.9" fill="none" stroke="#8b5cf6" strokeWidth="12" strokeLinecap="round" markerEnd="url(#arrow-violet)" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-x-6 gap-y-20 md:gap-x-40 md:gap-y-32">
              {[
                { num: "01", node: 1, colorCls: "bg-blue-50 text-blue-500 group-hover:bg-blue-500", shadowCls: "hover:shadow-[0_8px_30px_-4px_rgba(59,130,246,0.15)]" },
                { num: "02", node: 2, colorCls: "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500", shadowCls: "hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.15)]" },
                { num: "04", node: 4, colorCls: "bg-violet-50 text-violet-500 group-hover:bg-violet-500", shadowCls: "hover:shadow-[0_8px_30px_-4px_rgba(139,92,246,0.15)]" },
                { num: "03", node: 3, colorCls: "bg-amber-50 text-amber-500 group-hover:bg-amber-500", shadowCls: "hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.15)]" },
              ].map((item, i) => (
                <div key={i} className={`group relative flex flex-col items-center text-center bg-white/90 backdrop-blur-sm p-5 md:p-8 rounded-3xl border border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 ${item.shadowCls}`}>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-[20px] font-black mb-4 md:mb-5 group-hover:scale-110 group-hover:text-white transition-all duration-300 ${item.colorCls}`}>
                    {item.num}
                  </div>
                  <h3 className="text-[17px] md:text-[22px] font-bold text-zinc-900 mb-2">
                    {t(`Loop.node${item.node}Title` as any)}
                  </h3>
                  <p className="text-[13px] md:text-[16px] font-medium text-zinc-500 break-keep">
                    {t(`Loop.node${item.node}Desc` as any)}
                  </p>
                </div>
              ))}
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
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex gap-3 text-zinc-600">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-[16px] font-medium leading-relaxed">
                    {t(`Pricing.feature${i}` as any)}
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
