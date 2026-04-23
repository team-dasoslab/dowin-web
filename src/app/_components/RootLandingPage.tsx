"use client";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import {
  ArrowRight24Regular,
  Board24Regular,
  CalendarLtr24Regular,
  Checkmark24Regular,
  DataTrending24Regular,
  Flash24Regular,
  People24Regular,
  Pulse24Regular,
  TargetArrow24Regular,
  TextAlignLeft24Regular,
  ArrowTrending24Regular,
} from "@fluentui/react-icons";
import { useTranslations } from "next-intl";

export function RootLandingPage() {
  const t = useTranslations("Landing");

  return (
    <main className="min-h-screen overflow-x-hidden bg-white font-pretendard text-slate-900 selection:bg-primary/20 selection:text-slate-900">
      {/* Background Grid Pattern & Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="pointer-events-none absolute left-0 top-0 h-[800px] w-full overflow-hidden -z-10">
        <div className="absolute -left-1/4 -top-[100px] h-[700px] w-[700px] rounded-full bg-blue-100/30 blur-[120px]" />
        <div className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
      </div>

      {/* Top Banner Navigation */}
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-white/70 px-4 md:px-8 xl:px-12 backdrop-blur-xl border-b border-slate-200/50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-slate-900 text-white">
            <Flash24Regular className="h-4 w-4" />
          </div>
          <p className="font-outfit text-[22px] font-black tracking-tight text-slate-900">
            WIG
          </p>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="hidden sm:block text-[15px] font-bold text-slate-500 transition-colors"
          >
            {t("Navigation.login")}
          </Link>
          <Button
            asChild
            className="inline-flex items-center justify-center h-10 rounded-full bg-slate-900 px-6 text-[15px] font-bold text-white transition-all"
          >
            <Link href="/login">{t("Navigation.start")}</Link>
          </Button>
        </div>
      </header>

      {/* 1. Hero Section - Extreme Typography & Bleed Dashboard UI */}
      <section className="relative z-10 w-full pt-24 pb-0 md:pt-32 isolate overflow-hidden">
        <div className="flex flex-col items-center text-center space-y-6 max-w-[900px] mx-auto px-4">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-bold text-primary backdrop-blur-md ring-1 ring-inset ring-primary/20 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            {t("Hero.badge")}
          </div>

          {/* Headline - Editorial Tight typography */}
          <h1 className="font-pretendard text-[42px] leading-[1.15] font-black tracking-tight text-slate-900 md:text-[72px] md:tracking-[-0.03em] break-keep animate-fade-in-up [animation-delay:100ms] whitespace-pre-line">
            {t("Hero.headline")}
          </h1>

          <p className="max-w-[700px] text-[17px] leading-[1.6] text-slate-500 md:text-[20px] break-keep font-medium tracking-tight animate-fade-in-up [animation-delay:200ms] whitespace-pre-line">
            {t("Hero.description")}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up [animation-delay:300ms]">
            <Button
              asChild
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-[16px] font-bold text-white transition-all w-full sm:w-auto"
            >
              <Link href="/login">{t("Hero.cta")}</Link>
            </Button>
          </div>
        </div>

        {/* The "Bleed" Giant Dashboard Mockup */}
        <div className="relative mt-16 md:mt-24 w-full max-w-[1200px] mx-auto px-4 sm:px-8 xl:px-0 h-[340px] md:h-[500px]">
          {/* Main Dashboard Panel - bleeds down off the screen */}
          <div className="absolute top-0 left-0 lg:left-[5%] w-full lg:w-[90%] h-[600px] rounded-t-[24px] md:rounded-t-[32px] bg-white border border-slate-200/60 overflow-hidden flex flex-col">
            {/* Fake Mac Header */}
            <div className="h-12 w-full bg-slate-50/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 gap-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-slate-200" />
              <div className="w-3 h-3 rounded-full bg-slate-200" />
              <div className="w-3 h-3 rounded-full bg-slate-200" />
              <div className="mx-auto h-7 w-64 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-400 flex items-center justify-center font-bold tracking-wider">
                app.wig.service
              </div>
            </div>

            {/* Dashboard Layout */}
            <div className="flex-1 flex bg-slate-50/50">
              {/* Sidebar */}
              <div className="w-[80px] lg:w-[240px] border-r border-slate-200 bg-white p-4 shrink-0 hidden md:block">
                <div className="w-full h-10 rounded-xl bg-primary/10 mb-6 flex lg:px-4 items-center justify-center lg:justify-start gap-3">
                  <Flash24Regular className="w-5 h-5 text-primary" />
                  <span className="hidden lg:block font-bold text-primary text-sm">
                    {t("Mockup.workspace")}
                  </span>
                </div>
                <div className="space-y-2">
                  {[Board24Regular, TextAlignLeft24Regular, DataTrending24Regular, People24Regular].map(
                    (Icon, idx) => (
                      <div
                        key={idx}
                        className={`w-full h-10 rounded-xl flex items-center px-4 gap-3 ${idx === 0 ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
                      >
                        <Icon className="w-5 h-5 mx-auto lg:mx-0 shrink-0" />
                        <div className="hidden lg:block h-3 w-16 bg-current rounded-full opacity-20" />
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 lg:p-12 overflow-hidden flex flex-col gap-6">
                {/* Top Stats */}
                <div className="flex flex-wrap gap-4">
                  <div className="w-full lg:w-1/3 bg-white border border-slate-200 rounded-[24px] p-6">
                    <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2 gap-2 flex items-center">
                      <TargetArrow24Regular className="w-4 h-4" />{" "}
                      {t("Mockup.stats.wigTitle")}
                    </p>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-snug mb-5 whitespace-pre-line">
                      {t("Mockup.stats.wigGoal")}
                    </h3>
                    <div className="flex items-end justify-between">
                      <span className="text-[32px] font-outfit font-black text-primary leading-none">
                        68%
                      </span>
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100" />
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-rose-100" />
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +3
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 bg-white border border-slate-200 rounded-[24px] p-6 min-w-[300px]">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider gap-2 flex items-center">
                        <Pulse24Regular className="w-4 h-4" />{" "}
                        {t("Mockup.stats.leadTitle")}
                      </p>
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">
                        {t("Mockup.stats.week")}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { t: t("Mockup.stats.action1"), p: 4, out: 5 },
                        { t: t("Mockup.stats.action2"), p: 1, out: 1 },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1.5">
                              <span className="text-[14px] font-bold text-slate-700">
                                {item.t}
                              </span>
                              <span className="text-[12px] font-bold text-slate-400">
                                {item.p}/{item.out}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.p === item.out ? "bg-emerald-500" : "bg-primary"}`}
                                style={{
                                  width: `${(item.p / item.out) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Weekly List */}
                <div className="flex-1 bg-white border border-slate-200 rounded-[24px] p-6 overflow-hidden relative">
                  <p className="text-[14px] font-bold text-slate-800 mb-6">
                    {t("Mockup.teamStatus")}
                  </p>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 w-full rounded-2xl bg-slate-50 border border-slate-100 flex items-center px-4 gap-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-32 bg-slate-200 rounded-full" />
                          <div className="h-2 w-48 bg-slate-100 rounded-full" />
                        </div>
                        <div className="w-20 h-8 rounded-full bg-primary/10" />
                      </div>
                    ))}
                  </div>
                  {/* Fade out bottom gradient */}
                  <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Asymmetrical Metric Band */}
      <section className="bg-[#f8fafc] py-16 md:py-24 border-b border-slate-100">
        <div className="mx-auto max-w-[1200px] px-6 md:px-12">
          <h2 className="text-[28px] md:text-[40px] font-black tracking-[-0.03em] text-slate-900 leading-[1.2] mb-10 text-center md:text-left break-keep whitespace-pre-line">
            {t("MetricBand.title")}
          </h2>

          {/* Breaking the 3-grid: One large panel containing dynamic layout */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-200 p-8 md:p-12 overflow-hidden relative">
            {/* Soft decorative blur inside card */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 grid md:grid-cols-12 gap-10 md:gap-8 items-center">
              <div className="md:col-span-6 space-y-2">
                <p className="text-[17px] font-bold text-primary mb-2">
                  {t("MetricBand.oneTitle")}
                </p>
                <h3 className="text-[48px] md:text-[64px] font-outfit font-black tracking-tighter text-slate-900 leading-none">
                  ONE
                </h3>
                <p className="text-[16px] text-slate-500 font-medium leading-[1.6] max-w-[340px] pt-4 break-keep">
                  {t("MetricBand.oneDesc")}
                </p>
              </div>

              <div className="md:col-span-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-slate-50 rounded-[20px] p-6 md:p-8 border border-slate-100 transition-colors">
                  <p className="text-[36px] md:text-[42px] font-outfit font-black text-primary leading-none mb-3 tracking-tighter">
                    {t("MetricBand.stat1Value")}
                    <span className="text-[20px]">%</span>
                  </p>
                  <p className="text-[14px] font-bold text-slate-600 break-keep whitespace-pre-line">
                    {t("MetricBand.stat1Desc")}
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-[20px] p-6 md:p-8 border border-slate-100 transition-colors">
                  <p className="text-[36px] md:text-[42px] font-outfit font-black text-emerald-500 leading-none mb-3 tracking-tighter">
                    {t("MetricBand.stat2Value")}
                    <span className="text-[20px]">m</span>
                  </p>
                  <p className="text-[14px] font-bold text-slate-600 break-keep whitespace-pre-line">
                    {t("MetricBand.stat2Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why WIG? - Zigzag Deep Layering */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="mx-auto max-w-[1200px] px-6 md:px-12">
          <div className="text-center md:text-left mb-20 max-w-[700px]">
            <h2 className="font-pretendard text-[32px] leading-[1.2] font-black tracking-[-0.03em] text-slate-900 md:text-[48px] break-keep whitespace-pre-line">
              {t("WhyWig.header")}
            </h2>
            <p className="text-[18px] leading-[1.6] text-slate-500 mt-5 break-keep font-medium whitespace-pre-line">
              {t("WhyWig.description")}
            </p>
          </div>

          <div className="space-y-24">
            {/* Item 1: Text Left, Visual Right */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-5 lg:pr-12">
                <div
                  className={`inline-flex h-10 items-center px-4 rounded-[12px] bg-blue-50 text-blue-600 font-bold text-[13px]`}
                >
                  {t("WhyWig.item1Badge")}
                </div>
                <h3 className="text-[28px] font-black tracking-[-0.02em] text-slate-900 leading-tight whitespace-pre-line">
                  {t("WhyWig.item1Title")}
                </h3>
                <p className="text-[16px] leading-[1.7] text-slate-500 font-medium break-keep">
                  {t("WhyWig.item1Desc")}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-[80px] opacity-50" />
                <div className="relative bg-white rounded-[24px] p-6 border border-slate-200">
                  <div className="h-48 w-full bg-slate-50 rounded-[20px] border border-slate-100 flex flex-col items-center justify-center text-center px-6">
                    <TargetArrow24Regular className="w-10 h-10 text-blue-500 mb-4" />
                    <p className="text-[20px] font-bold text-slate-800">
                      {t("WhyWig.item1VisualGoal")}
                    </p>
                    <p className="text-[13px] font-bold text-slate-400 mt-2">
                      {t("WhyWig.item1VisualDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 2: Visual Left, Text Right */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-[80px] opacity-50" />
                <div className="relative bg-white rounded-[24px] p-6 border border-slate-200">
                  <div className="h-40 w-full bg-slate-50 rounded-[16px] border border-slate-100 p-6 flex flex-col justify-center">
                    <p className="font-bold text-slate-600 mb-4 flex items-center gap-2 text-[14px]">
                      <Pulse24Regular className="w-5 h-5 text-emerald-500" />
                      {t("WhyWig.item2VisualTitle")}
                    </p>
                    <div className="bg-white rounded-xl h-14 border border-slate-200 flex items-center px-4 gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Checkmark24Regular className="w-4 h-4" />
                      </div>
                      <p className="font-bold text-slate-800 text-[14px]">
                        {t("WhyWig.item2VisualAction")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-5 lg:pl-12">
                <div
                  className={`inline-flex h-10 items-center px-4 rounded-[12px] bg-emerald-50 text-emerald-600 font-bold text-[13px]`}
                >
                  {t("WhyWig.item2Badge")}
                </div>
                <h3 className="text-[28px] font-black tracking-[-0.02em] text-slate-900 leading-tight whitespace-pre-line">
                  {t("WhyWig.item2Title")}
                </h3>
                <p className="text-[16px] leading-[1.7] text-slate-500 font-medium break-keep">
                  {t("WhyWig.item2Desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Execution Loop Section (Dark Depth) */}
      <section
        id="how-it-works"
        className="bg-slate-900 py-24 md:py-32 text-white relative overflow-hidden"
      >
        {/* Deep perspective grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.2),transparent_60%)] pointer-events-none" />

        <div className="mx-auto max-w-[1200px] px-6 text-center md:px-12 mb-20 md:mb-24 relative z-10">
          <h2 className="font-pretendard text-[36px] leading-[1.2] font-black tracking-[-0.03em] md:text-[48px] mb-5 break-keep whitespace-pre-line">
            {t("ExecutionLoop.title")}
          </h2>
          <p className="text-[17px] text-slate-400 leading-[1.7] max-w-[600px] mx-auto break-keep font-medium whitespace-pre-line">
            {t("ExecutionLoop.description")}
          </p>
        </div>

        <div className="mx-auto max-w-[1000px] px-6 md:px-8 space-y-8 relative z-10">
          {/* Layered Vertical Steps instead of huge blocks */}
          <div className="relative pl-0 md:pl-24 space-y-12 md:space-y-16">
            {/* Step 1 */}
            <div className="relative flex flex-col md:flex-row gap-8 lg:gap-12 items-start md:items-center">
              <div className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[16px] bg-primary items-center justify-center font-outfit text-xl font-black border border-white/20 text-white z-10 transition-transform">
                1
              </div>
              <div className="md:hidden flex h-12 w-12 rounded-xl bg-primary items-center justify-center font-outfit text-xl font-black text-white">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-[24px] md:text-[32px] font-black tracking-tight text-white mb-3 break-keep">
                  {t("ExecutionLoop.step1Title")}
                </h3>
                <p className="text-[16px] text-slate-300 leading-[1.7] break-keep font-medium">
                  {t("ExecutionLoop.step1Desc")}
                </p>
              </div>
              <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-[20px] p-6 backdrop-blur-md rotate-1 transition-transform">
                <div className="h-2 w-16 bg-white/20 rounded-full mb-3" />
                <div className="h-5 w-full max-w-[180px] bg-white/80 rounded-full mb-6" />
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[45%]" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col md:flex-row gap-8 lg:gap-12 items-start md:items-center">
              <div className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[16px] bg-slate-800 items-center justify-center font-outfit text-xl font-black border border-white/10 text-slate-300 z-10 transition-transform">
                2
              </div>
              <div className="md:hidden flex h-12 w-12 rounded-xl bg-slate-800 items-center justify-center font-outfit text-xl font-black border border-white/10 text-white">
                2
              </div>
              <div className="flex-1 md:order-2">
                <h3 className="text-[24px] md:text-[32px] font-black tracking-tight text-white mb-3 break-keep">
                  {t("ExecutionLoop.step2Title")}
                </h3>
                <p className="text-[16px] text-slate-300 leading-[1.7] break-keep font-medium">
                  {t("ExecutionLoop.step2Desc")}
                </p>
              </div>
              <div className="flex-1 w-full md:order-1 bg-white/5 border border-white/10 rounded-[20px] p-6 backdrop-blur-md -rotate-1 transition-transform text-center">
                <div className="inline-flex gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border ${i < 3 ? "bg-primary border-primary" : "bg-transparent border-white/20 text-white/20"}`}
                    >
                      <Checkmark24Regular className="w-5 h-5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col md:flex-row gap-8 lg:gap-12 items-start md:items-center">
              <div className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[16px] bg-slate-800 items-center justify-center font-outfit text-xl font-black border border-white/10 text-slate-300 z-10 transition-transform">
                3
              </div>
              <div className="md:hidden flex h-12 w-12 rounded-xl bg-slate-800 items-center justify-center font-outfit text-xl font-black border border-white/10 text-white">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-[24px] md:text-[32px] font-black tracking-tight text-white mb-3 break-keep">
                  {t("ExecutionLoop.step3Title")}
                </h3>
                <p className="text-[16px] text-slate-300 leading-[1.7] break-keep font-medium">
                  {t("ExecutionLoop.step3Desc")}
                </p>
              </div>
              <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-[20px] p-6 backdrop-blur-md rotate-1 transition-transform">
                <div className="flex items-end justify-between border-b border-white/10 pb-3 mb-3">
                  <div className="h-2.5 w-14 bg-slate-500 rounded" />
                  <p className="font-outfit text-[32px] font-black leading-none tracking-tighter">
                    92<span className="text-[16px] opacity-50">%</span>
                  </p>
                </div>
                <div className="h-3 w-24 bg-white/20 rounded" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Bento Grid */}
      <section className="py-20 md:py-32 bg-slate-50">
        <div className="mx-auto max-w-[1200px] px-6 md:px-12">
          <h3 className="text-[32px] md:text-[44px] font-black tracking-[-0.03em] text-slate-900 mb-12 text-center lg:text-left leading-tight break-keep whitespace-pre-line">
            {t("Features.title")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-[220px]">
            <div className="md:col-span-8 bg-white rounded-[24px] border border-slate-200 p-8 transition-all overflow-hidden relative">
              <div className="relative z-10 max-w-[300px]">
                <h4 className="text-[20px] font-black text-slate-900 mb-3 tracking-tight">
                  {t("Features.item1Title")}
                </h4>
                <p className="text-[15px] text-slate-500 leading-relaxed break-keep font-medium">
                  {t("Features.item1Desc")}
                </p>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-[50%] bg-gradient-to-l from-primary/5 to-transparent flex items-center justify-end pr-8">
                <ArrowTrending24Regular className="w-32 h-32 text-primary/10 transition-transform" />
              </div>
            </div>

            <div className="md:col-span-4 bg-primary rounded-[24px] p-8 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform" />
              <Board24Regular className="w-8 h-8 mb-6" />
              <h4 className="text-[20px] font-black mb-2">
                {t("Features.item2Title")}
              </h4>
              <p className="text-[14px] opacity-80 leading-relaxed font-medium break-keep">
                {t("Features.item2Desc")}
              </p>
            </div>

            <div className="md:col-span-5 bg-white rounded-[24px] border border-slate-200 p-8 transition-all overflow-hidden relative">
              <CalendarLtr24Regular className="w-8 h-8 text-slate-300 transition-colors mb-6" />
              <h4 className="text-[20px] font-black text-slate-900 mb-2 tracking-tight">
                {t("Features.item3Title")}
              </h4>
              <p className="text-[15px] text-slate-500 leading-relaxed font-medium break-keep">
                {t("Features.item3Desc")}
              </p>
            </div>

            <div className="md:col-span-7 bg-white rounded-[24px] border border-slate-200 p-8 transition-all flex flex-col justify-end relative overflow-hidden">
              <div className="absolute top-6 right-6">
                <TargetArrow24Regular className="w-16 h-16 text-slate-100 transition-all" />
              </div>
              <h4 className="text-[20px] font-black text-slate-900 mb-2 tracking-tight">
                {t("Features.item4Title")}
              </h4>
              <p className="text-[15px] text-slate-500 leading-relaxed font-medium max-w-[300px] break-keep">
                {t("Features.item4Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer CTA */}
      <footer className="w-full bg-white py-24 md:py-32 flex flex-col items-center text-center px-6 border-t border-slate-100">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-primary to-primary-light mb-10 transition-transform">
          <Flash24Regular className="h-8 w-8 text-white fill-white" />
        </div>
        <h2 className="font-pretendard text-[36px] leading-[1.1] font-black tracking-[-0.03em] md:text-[52px] text-slate-900 mb-6 break-keep whitespace-pre-line">
          {t("Footer.headline")}
        </h2>
        <p className="text-[18px] text-slate-500 mb-10 max-w-[600px] leading-[1.6] break-keep font-medium whitespace-pre-line">
          {t("Footer.description")}
        </p>
        <Button
          asChild
          className="inline-flex h-[60px] items-center justify-center rounded-2xl bg-slate-900 px-10 text-[18px] font-bold text-white transition-all"
        >
          <Link href="/login">
            {t("Footer.cta")} <ArrowRight24Regular className="ml-3 h-5 w-5 opacity-70" />
          </Link>
        </Button>
        <p className="text-[13px] text-slate-400 mt-20 font-outfit font-bold tracking-wider uppercase">
          © 2026 WIG. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
