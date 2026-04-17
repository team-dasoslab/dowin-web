import { Button } from "@/components/ui/Button";
import {
  Activity,
  AlignLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  LayoutDashboard,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/routing";

const PRICING_PLANS = [
  {
    name: "FREE",
    eyebrow: "지금 바로 사용 가능",
    description:
      "작은 팀 하나 제대로 굴려보면서, 이 방식이 우리한테 진짜 통하는지 확인하는 데 맞춘 플랜입니다.",
    price: "0원",
    cadence: "/ 월",
    accent: "primary",
    highlight: "최대 10명까지",
    ctaLabel: "무료로 시작하기",
    features: [
      "작은 팀 하나 굴리기엔 충분한 최대 10명",
      "지난 반기 흐름까지 돌아볼 수 있는 최근 6개월 기록",
      "이번 달 팀 운영 포인트를 빠르게 보는 최근 4주 리포트",
      "목표 세우고, 기록하고, 주간 점검하는 핵심 루프는 전부 사용",
      "혼자 기록만 남기는 게 아니라 팀 흐름까지 같이 확인",
    ],
  },
  {
    name: "STANDARD",
    eyebrow: "출시 예정",
    description:
      "기록을 보는 단계에서 끝내지 않고, 리더가 직접 움직이며 팀 실행 밀도까지 끌어올릴 때 필요한 플랜입니다.",
    price: "출시 예정",
    cadence: "",
    accent: "slate",
    highlight: "리더 개입 기능 포함",
    ctaLabel: "출시 알림 받기",
    features: [
      "리더가 필요한 팀원에게 바로 보내는 직접 리마인드",
      "회의 자료나 보고용으로 바로 꺼내 쓰는 CSV export",
      "무료보다 더 길게 쌓아두고 보는 기록과 리포트 히스토리",
      "숫자만 보는 데서 끝나지 않는 운영 판단용 확장 분석",
      "팀 실행을 더 촘촘하게 관리하게 만드는 운영 전용 업그레이드",
    ],
  },
] as const;

export function RootLandingPage() {
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
            <Zap className="h-4 w-4" />
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
            로그인
          </Link>
          <Button
            asChild
            className="inline-flex items-center justify-center h-10 rounded-full bg-slate-900 px-6 text-[15px] font-bold text-white transition-all"
          >
            <Link href="/login">시작하기</Link>
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
            성과를 만드는 팀의 실행 리듬
          </div>

          {/* Headline - Editorial Tight typography */}
          <h1 className="font-pretendard text-[42px] leading-[1.15] font-black tracking-tight text-slate-900 md:text-[72px] md:tracking-[-0.03em] break-keep animate-fade-in-up [animation-delay:100ms]">
            매일 바쁘게 쳐내는데,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              왜 성과는 제자리일까요?
            </span>
          </h1>

          <p className="max-w-[700px] text-[17px] leading-[1.6] text-slate-500 md:text-[20px] break-keep font-medium tracking-tight animate-fade-in-up [animation-delay:200ms]">
            당장 눈앞의 불 끄느라 바빠 정작 중요한 목표를 놓치고 있는 팀을 위해.
            <br className="hidden md:block" />
            팀의 판도를 단번에 바꿀 &apos;단 하나의 목표&apos;에 압도적으로
            집중하게 해드립니다.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up [animation-delay:300ms]">
            <Button
              asChild
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-[16px] font-bold text-white transition-all w-full sm:w-auto"
            >
              <Link href="/login">지금 바로 시작하기</Link>
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
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="hidden lg:block font-bold text-primary text-sm">
                    Our Workspace
                  </span>
                </div>
                <div className="space-y-2">
                  {[LayoutDashboard, AlignLeft, BarChart3, Users].map(
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
                      <Target className="w-4 h-4" /> 최우선 목표
                    </p>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-snug mb-5">
                      리텐션 40% 방어 및<br />
                      신규 파이프라인 구축
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
                        <Activity className="w-4 h-4" /> 선행지표: 이번 주 액션
                      </p>
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">
                        Week 4
                      </span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { t: "이탈 징후 고객 10명 통화", p: 4, out: 5 },
                        { t: "온보딩 UX A/B 테스트 배포", p: 1, out: 1 },
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
                    팀원별 투명한 성과 현황
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
          <h2 className="text-[28px] md:text-[40px] font-black tracking-[-0.03em] text-slate-900 leading-[1.2] mb-10 text-center md:text-left break-keep">
            진짜 일하는 방식을
            <br />
            숫자로 증명합니다.
          </h2>

          {/* Breaking the 3-grid: One large panel containing dynamic layout */}
          <div className="bg-white rounded-[24px] md:rounded-[32px] border border-slate-200 p-8 md:p-12 overflow-hidden relative">
            {/* Soft decorative blur inside card */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 grid md:grid-cols-12 gap-10 md:gap-8 items-center">
              <div className="md:col-span-6 space-y-2">
                <p className="text-[17px] font-bold text-primary mb-2">
                  우리가 집중할 단 하나
                </p>
                <h3 className="text-[48px] md:text-[64px] font-outfit font-black tracking-tighter text-slate-900 leading-none">
                  ONE
                </h3>
                <p className="text-[16px] text-slate-500 font-medium leading-[1.6] max-w-[340px] pt-4 break-keep">
                  이것저것 다 욕심내다가 이도 저도 안 된 경험, 꽤 익숙하시죠?
                  자잘한 건 과감히 버려두세요. 우리 팀이 다음 단계로 도약할 수
                  있는 단 하나의 목표에만 올인합니다.
                </p>
              </div>

              <div className="md:col-span-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-slate-50 rounded-[20px] p-6 md:p-8 border border-slate-100 transition-colors">
                  <p className="text-[36px] md:text-[42px] font-outfit font-black text-primary leading-none mb-3 tracking-tighter">
                    80<span className="text-[20px]">%</span>
                  </p>
                  <p className="text-[14px] font-bold text-slate-600 break-keep">
                    선행지표 액션에
                    <br />
                    투자하는 우리 팀의 에너지
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-[20px] p-6 md:p-8 border border-slate-100 transition-colors">
                  <p className="text-[36px] md:text-[42px] font-outfit font-black text-emerald-500 leading-none mb-3 tracking-tighter">
                    10<span className="text-[20px]">m</span>
                  </p>
                  <p className="text-[14px] font-bold text-slate-600 break-keep">
                    길어질 필요 없는
                    <br />
                    압도적으로 짧은 매주 점검
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
            <h2 className="font-pretendard text-[32px] leading-[1.2] font-black tracking-[-0.03em] text-slate-900 md:text-[48px] break-keep">
              팀의 목표를 달성하는
              <br />
              가장 확실하고 주도적인 흐름
            </h2>
            <p className="text-[18px] leading-[1.6] text-slate-500 mt-5 break-keep font-medium">
              결과 지표는 이미 일어난 과거이기에 우리가 곧바로 바꿀 수는
              없습니다.
              <br className="hidden lg:block" />
              하지만 결과를 만들어낼 <strong>&apos;오늘의 행동&apos;</strong>은
              우리 스스로 계획하고 100% 통제할 수 있습니다. 막연한 불안감을 넘어
              주도적인 팀의 실행력을 갖춰보세요.
            </p>
          </div>

          <div className="space-y-24">
            {/* Item 1: Text Left, Visual Right */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-5 lg:pr-12">
                <div
                  className={`inline-flex h-10 items-center px-4 rounded-[12px] bg-blue-50 text-blue-600 font-bold text-[13px]`}
                >
                  가장 중요한 단 하나
                </div>
                <h3 className="text-[28px] font-black tracking-[-0.02em] text-slate-900 leading-tight">
                  팀의 마일스톤,
                  <br />
                  최우선 목표 (WIG)
                </h3>
                <p className="text-[16px] leading-[1.7] text-slate-500 font-medium break-keep">
                  수많은 업무 사이에서 길을 잃지 않도록 지표가 되어 드릴게요. 팀
                  전체의 판도를 바꿀 수 있는 가장 중요하고 임팩트 있는 단 하나의
                  목표에 집중해보세요.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-[80px] opacity-50" />
                <div className="relative bg-white rounded-[24px] p-6 border border-slate-200">
                  <div className="h-48 w-full bg-slate-50 rounded-[20px] border border-slate-100 flex flex-col items-center justify-center text-center px-6">
                    <Target className="w-10 h-10 text-blue-500 mb-4" />
                    <p className="text-[20px] font-bold text-slate-800">
                      연말까지 월 매출 1억 달성
                    </p>
                    <p className="text-[13px] font-bold text-slate-400 mt-2">
                      이 목표 외의 업무는 후순위로 미뤄집니다.
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
                      <Activity className="w-5 h-5 text-emerald-500" />
                      오늘 수행할 핵심 선행지표
                    </p>
                    <div className="bg-white rounded-xl h-14 border border-slate-200 flex items-center px-4 gap-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Check className="w-4 h-4" />
                      </div>
                      <p className="font-bold text-slate-800 text-[14px]">
                        고가치 고객 5명 심층 인터뷰
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-5 lg:pl-12">
                <div
                  className={`inline-flex h-10 items-center px-4 rounded-[12px] bg-emerald-50 text-emerald-600 font-bold text-[13px]`}
                >
                  유일하게 통제 가능한 행동
                </div>
                <h3 className="text-[28px] font-black tracking-[-0.02em] text-slate-900 leading-tight">
                  행동을 바꾸는
                  <br />
                  선행지표
                </h3>
                <p className="text-[16px] leading-[1.7] text-slate-500 font-medium break-keep">
                  이미 다 끝나버린 결과 지표만 노려본다고 숫자가 바뀔 리 없죠.
                  결과가 아니라, 확고하게 지표를 견인할 수 있는 구체적인
                  &apos;행동&apos;을 매일매일 쌓아 올리는 데 집착하세요.
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
          <h2 className="font-pretendard text-[36px] leading-[1.2] font-black tracking-[-0.03em] md:text-[48px] mb-5 break-keep">
            복잡함을 걷어낸
            <br />단 3단계의 실행 흐름.
          </h2>
          <p className="text-[17px] text-slate-400 leading-[1.7] max-w-[600px] mx-auto break-keep font-medium">
            입력이 부담스러운 복잡한 템플릿 대신,
            <br /> 팀원 모두가 편안하고 투명하게 바라볼 수 있는 가장 직관적인
            흐름을 제안합니다.
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
                  단 하나의 목표 정조준
                </h3>
                <p className="text-[16px] text-slate-300 leading-[1.7] break-keep font-medium">
                  이번 주 우리가 달성해야 할 WIG를 최상단에 고정합니다. 흔들리지
                  않고 한 곳을 바라봅니다.
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
                  매일매일 행동 누적
                </h3>
                <p className="text-[16px] text-slate-300 leading-[1.7] break-keep font-medium">
                  거창한 회의실 대신 눈앞의 대시보드에서 행동 지표 데일리 빙고를
                  채워나갑니다. 도장 깨기 하듯 매일의 성취감이 쌓이며 실행의
                  관성이 붙습니다.
                </p>
              </div>
              <div className="flex-1 w-full md:order-1 bg-white/5 border border-white/10 rounded-[20px] p-6 backdrop-blur-md -rotate-1 transition-transform text-center">
                <div className="inline-flex gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border ${i < 3 ? "bg-primary border-primary" : "bg-transparent border-white/20 text-white/20"}`}
                    >
                      <Check className="w-5 h-5" strokeWidth={3} />
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
                  핑계 없는 점수판, 주간 회고
                </h3>
                <p className="text-[16px] text-slate-300 leading-[1.7] break-keep font-medium">
                  한 달을 묵묵히 기다릴 필요 없습니다. 주 단위로 달성 현황을
                  점검하고, 막힌 부분은 빠르게 보완하며 팀의 리듬을 맞춰갑니다.
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
          <h3 className="text-[32px] md:text-[44px] font-black tracking-[-0.03em] text-slate-900 mb-12 text-center lg:text-left leading-tight break-keep">
            불필요한 관리는 없애고,
            <br className="hidden lg:block" /> 투명한 실행만 남깁니다.
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-[220px]">
            <div className="md:col-span-8 bg-white rounded-[24px] border border-slate-200 p-8 transition-all overflow-hidden relative">
              <div className="relative z-10 max-w-[300px]">
                <h4 className="text-[20px] font-black text-slate-900 mb-3 tracking-tight">
                  팀 전체의 점수판
                </h4>
                <p className="text-[15px] text-slate-500 leading-relaxed break-keep font-medium">
                  워크스페이스 투명하게 공유되어 우리가 지고 있는지 이기고
                  있는지 시각적으로 확인합니다.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-[50%] bg-gradient-to-l from-primary/5 to-transparent flex items-center justify-end pr-8">
                <TrendingUp className="w-32 h-32 text-primary/10 transition-transform" />
              </div>
            </div>

            <div className="md:col-span-4 bg-primary rounded-[24px] p-8 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform" />
              <LayoutDashboard className="w-8 h-8 mb-6" />
              <h4 className="text-[20px] font-black mb-2">개인 대시보드</h4>
              <p className="text-[14px] opacity-80 leading-relaxed font-medium break-keep">
                매일 출근 직후 접속해 내 행동의 흐름만을 가볍게 기록합니다.
              </p>
            </div>

            <div className="md:col-span-5 bg-white rounded-[24px] border border-slate-200 p-8 transition-all overflow-hidden relative">
              <CalendarDays className="w-8 h-8 text-slate-300 transition-colors mb-6" />
              <h4 className="text-[20px] font-black text-slate-900 mb-2 tracking-tight">
                정기 주간 회고
              </h4>
              <p className="text-[15px] text-slate-500 leading-relaxed font-medium break-keep">
                매주 잘한 점과 막힌 점을 회고하며 불필요한 미팅 시간을
                극단적으로 줄입니다.
              </p>
            </div>

            <div className="md:col-span-7 bg-white rounded-[24px] border border-slate-200 p-8 transition-all flex flex-col justify-end relative overflow-hidden">
              <div className="absolute top-6 right-6">
                <Target className="w-16 h-16 text-slate-100 transition-all" />
              </div>
              <h4 className="text-[20px] font-black text-slate-900 mb-2 tracking-tight">
                선행지표 쌓아가기
              </h4>
              <p className="text-[15px] text-slate-500 leading-relaxed font-medium max-w-[300px] break-keep">
                쳐다보기 싫은 딱딱한 테이블 뷰는 버리세요. 빙고판을 채우듯
                재미있게 오늘의 남은 액션을 클리어하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6 md:px-12">
          <div className="mb-12 max-w-[760px] mx-auto text-center">
            <h2 className="text-[32px] leading-[1.15] font-black tracking-[-0.03em] text-slate-900 md:text-[48px] break-keep">
              가벼운 팀 단위 도입부터
              <br />
              전사적 확장까지.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.7] text-slate-500 md:text-[19px] break-keep font-medium">
              도입의 문턱은 완전히 없앴습니다. 무료 플랜으로 핵심 실행 흐름을
              충분히 구축한 후, 팀의 관리 깊이가 더해질 때 합리적으로
              확장하세요.
            </p>
          </div>

          <div className="mx-auto grid gap-6 lg:grid-cols-[1.05fr_0.95fr] max-w-[960px]">
            {PRICING_PLANS.map((plan) => {
              const isFree = plan.name === "FREE";

              return (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-[24px] border p-8 lg:p-10 ${
                    isFree
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <p
                        className={`mb-2 text-[12px] font-bold uppercase tracking-wider ${
                          isFree ? "text-primary" : "text-slate-400"
                        }`}
                      >
                        {plan.eyebrow}
                      </p>
                      <h3
                        className={`text-[28px] font-black tracking-tight font-outfit ${isFree ? "text-slate-900" : "text-slate-400"}`}
                      >
                        {plan.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mb-6 flex items-end gap-2">
                    <span
                      className={`font-outfit text-[36px] font-black leading-none tracking-tighter ${isFree ? "text-slate-900" : "text-slate-300"}`}
                    >
                      {plan.price}
                    </span>
                    {plan.cadence ? (
                      <span
                        className={`pb-1.5 text-sm font-bold ${
                          isFree ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {plan.cadence}
                      </span>
                    ) : null}
                  </div>

                  <p
                    className={`mb-8 text-[15px] leading-[1.65] font-medium break-keep ${
                      isFree ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mb-10 space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-4">
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            isFree
                              ? "bg-primary/20 text-primary"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </div>
                        <p
                          className={`text-[15px] leading-[1.5] font-medium break-keep ${
                            isFree ? "text-slate-700" : "text-slate-400"
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
                        className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-slate-900 px-6 text-[15px] font-bold text-white transition-none hover:bg-slate-800"
                      >
                        <Link href="/login">{plan.ctaLabel}</Link>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-slate-100 px-6 text-[15px] font-bold text-slate-400 transition-none"
                      >
                        {plan.ctaLabel}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Footer CTA */}
      <footer className="w-full bg-white py-24 md:py-32 flex flex-col items-center text-center px-6 border-t border-slate-100">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-primary to-primary-light mb-10 transition-transform">
          <Zap className="h-8 w-8 text-white fill-white" />
        </div>
        <h2 className="font-pretendard text-[36px] leading-[1.1] font-black tracking-[-0.03em] md:text-[52px] text-slate-900 mb-6 break-keep">
          진짜 실행의 흐름,
          <br />
          지금 바로 시작해볼까요?
        </h2>
        <p className="text-[18px] text-slate-500 mb-10 max-w-[600px] leading-[1.6] break-keep font-medium">
          초기 세팅에 들어가는 고민과 시간은 덜어냈습니다.{" "}
          <br className="hidden sm:block" />
          이제 팀원들과 함께 즐겁게 목표를 향해 달려보세요.
        </p>
        <Button
          asChild
          className="inline-flex h-[60px] items-center justify-center rounded-2xl bg-slate-900 px-10 text-[18px] font-bold text-white transition-all"
        >
          <Link href="/login">
            WIG 무료로 시작하기{" "}
            <ArrowRight className="ml-3 h-5 w-5 opacity-70" />
          </Link>
        </Button>
        <p className="text-[13px] text-slate-400 mt-20 font-outfit font-bold tracking-wider uppercase">
          © 2026 WIG. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
