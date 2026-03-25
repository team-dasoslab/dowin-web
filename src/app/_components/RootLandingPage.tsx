import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Activity,
  BarChart3,
  Check,
  CheckCircle2,
  FolderArchive,
  LayoutDashboard,
  Settings,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const PREVIEW_NAV: { href: string; icon: LucideIcon }[] = [
  { href: "/dashboard", icon: Users },
  { href: "/scoreboards", icon: FolderArchive },
  { href: "/profile", icon: User },
  { href: "/setup?mode=update", icon: Settings },
];

const TERM_EXPLANATIONS = [
  {
    label: "왜 매번 흐지부지될까요?",
    title: "진짜 중요한가요? 가중목 (WIG)",
    description:
      "모든 것을 완벽하게 해내려다 보면, 결국 몰아치는 여러 업무에 휩쓸려 아무것도 성취하지 못하죠. 팀의 판도를 단번에 바꿀 수 있는 단 하나의 가장 중요한 목표에 모든 에너지를 모아보세요.",
    icon: Target,
    tone: "bg-[#eef0ff] text-primary border-primary/20",
    example: "올해 말까지 신규 수익률 15%에서 21%로 올리기",
  },
  {
    label: "결과가 나온 뒤엔 늦어요",
    title: "성적표만 기다리고 있나요? 후행지표",
    description:
      "'수익률', '가입자 수' 등은 기간이 끝나야만 비로소 확인할 수 있는 최종 결과표예요. 이 값은 여러분이 당장 노력해서 즉각적으로 바꿀 수 있는 숫자가 아니죠.",
    icon: BarChart3,
    tone: "bg-[#fff5ea] text-[#ea7a16] border-[#ea7a16]/20",
    example: "주간 실사용자 10,000명 달성",
  },
  {
    label: "유일한 통제권, 오늘의 행동",
    title: "결과를 바꿀 수 있는 단 하나, 선행지표",
    description:
      "성적표(후행지표)를 움직이게 만드는, 단 하나 확실하게 내 의지로 해낼 수 있는 행동 단위예요. 매일매일 이 선행지표를 쌓아가는 것만이 결과를 바꾸는 유일한 열쇠랍니다.",
    icon: Activity,
    tone: "bg-[#eef8f1] text-success border-success/20",
    example: "매일 한 번씩, 가입 중 이탈한 고객에게 전화하기",
  },
];

const FEATURES = [
  {
    title: "개인 대시보드",
    description:
      "아침마다 가장 먼저 열어보는 오늘 할 일의 흐름. 선행지표를 매일 기록하고 주간 달성률을 바로 확인해요.",
    icon: LayoutDashboard,
  },
  {
    title: "워크스페이스 공유",
    description:
      "팀원들의 진행 상황을 한눈에 파악해요. 누가 이번 주 목표를 향해 달리고 있는지 투명하게 공유돼요.",
    icon: Users,
  },
  {
    title: "주간 리뷰 (Review)",
    description:
      "한 주를 마무리하며 잘한 점과 막힌 점을 서로 기록하고, 다음 주를 위한 액션 아이템을 함께 도출해요.",
    icon: CheckCircle2,
  },
  {
    title: "점수판 (Scoreboard)",
    description:
      "우리가 이기고 있는지 지고 있는지, 즉각적으로 보여주는 시각적 피드백으로 건강한 성취감을 자극해요.",
    icon: TrendingUp,
  },
];

export function RootLandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background font-pretendard text-text-primary">
      <div className="relative mx-auto max-w-[1180px] px-4 pb-20 pt-4 md:px-8 md:pb-28 md:pt-6 animate-linear-in">
        <div className="pointer-events-none absolute left-[-140px] top-[120px] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(94,106,210,0.16),rgba(94,106,210,0.05)_42%,transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute right-[-100px] top-[240px] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(181,229,255,0.16),rgba(181,229,255,0.05)_40%,transparent_72%)] blur-3xl" />
        <div className="pointer-events-none absolute left-[28%] top-[720px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(255,220,236,0.14),rgba(255,220,236,0.04)_40%,transparent_72%)] blur-3xl" />

        {/* 1. Header */}
        <header className="relative z-10 flex items-center justify-between gap-3 pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tracking-tight text-text-primary">
                WIG
              </p>
            </div>
          </Link>

          <Button
            asChild
            className="btn-linear-primary inline-flex min-h-10 items-center justify-center rounded-full px-5 text-[15px] font-bold transition-all"
          >
            <Link href="/login">시작하기</Link>
          </Button>
        </header>

        {/* 2. Hero */}
        <section className="relative z-10 grid min-h-[calc(100vh-120px)] items-center gap-12 py-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(500px,1.15fr)] lg:py-12">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              Focus on execution
            </div>

            <div className="space-y-5">
              <h1 className="max-w-[560px] font-inter text-[42px] leading-[1.1] font-bold tracking-[-0.05em] text-text-primary md:text-[62px] md:leading-[1.05]">
                팀의 최우선 목표,
                <br />
                가장 선명하게
                <br />
                공유되도록
              </h1>
              <p className="max-w-[440px] text-[17px] leading-relaxed text-text-secondary">
                정신없이 흘러가는 한 주 속에서도, 진짜 중요한 방향을 잃지 않게.
                <br className="hidden md:block" />
                목표 설정부터 매일의 기록, 주간 점검까지 하나의 흐름으로
                이어주는 가장 직관적인 팀 목표 트래커예요.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row pt-2">
              <Button
                asChild
                className="btn-linear-primary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-[15px] font-bold transition-all"
              >
                <Link href="/login">지금, 무료로 시작하기</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[32px] border border-white/70 bg-white/50 p-4 shadow-[0_24px_80px_rgba(17,24,39,0.06)] backdrop-blur-xl">
              <Card className="overflow-hidden rounded-[24px] border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-[11px] text-text-muted">WIG workspace</p>
                    <h2 className="text-sm font-bold text-text-primary">
                      나의 점수판
                    </h2>
                  </div>
                  <div className="flex items-center gap-1">
                    {PREVIEW_NAV.map(({ href, icon: Icon }) => (
                      <span
                        key={href}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-text-muted"
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 p-5 bg-background/50 rounded-b-[24px]">
                  {/* WIG Card Replica */}
                  <div className="rounded-lg border border-border bg-white overflow-hidden shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                            가중목
                          </p>
                          <h2 className="text-sm font-bold text-text-primary">
                            Q3 핵심 지표 리텐션 40% 달성
                          </h2>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-text-muted">
                          이번 주 달성률
                        </p>
                        <p className="font-mono text-xl font-bold tracking-tight text-green-600">
                          80%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-sub-background px-4 py-2.5">
                      <Target className="h-3.5 w-3.5 text-text-muted" />
                      <span className="text-[10px] font-bold tracking-widest text-text-muted">
                        후행지표
                      </span>
                      <span className="text-xs font-medium text-text-primary">
                        주간 활성 사용자(WAU) 1.5배 증가
                      </span>
                    </div>
                  </div>

                  {/* Daily Action Replica (WeeklyMobileCard) */}
                  <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          신규 인바운드 콜 10건 돌리기
                        </p>
                        <p className="text-[11px] text-text-muted">
                          목표 5회 / 주
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-1 bg-sub-background rounded-full overflow-hidden border border-border">
                          <div className="h-full bg-primary w-[80%] rounded-full" />
                        </div>
                        <span className="text-[10px] font-bold font-mono text-text-secondary">
                          4/5
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {["월", "화", "수", "목", "금", "토", "일"].map(
                        (day, i) => {
                          const isToday = i === 4; // 금요일
                          const isChecked = i < 4; // 월-목 완료
                          return (
                            <div key={day} className="space-y-1 text-center">
                              <p
                                className={`text-[10px] font-bold ${isToday ? "text-primary" : "text-text-muted"}`}
                              >
                                {day}
                              </p>
                              <div
                                className={`flex h-8 w-full items-center justify-center rounded-md border text-sm transition-colors ${
                                  isChecked
                                    ? "border-primary bg-primary text-white"
                                    : isToday
                                      ? "border-primary/30 bg-primary/5 text-primary"
                                      : "border-border bg-sub-background text-text-muted"
                                }`}
                              >
                                {isChecked ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <span className="text-[10px] font-mono">
                                    {i + 12}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 4. 4DX Concept Section */}
        <section className="relative z-10 border-t border-border py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Why WIG?
              </p>
              <h2 className="font-inter text-[36px] leading-[1.15] font-bold tracking-[-0.04em] text-text-primary md:text-[46px]">
                진짜 성과를 내려면
                <br />
                관점부터 달라야 하니까요
              </h2>
              <p className="text-[16px] leading-relaxed text-text-secondary max-w-[340px] pt-3">
                매일 바쁘게 일하지만, 정작 가장 중요한 목표 앞에서는 무너진 적이
                있으신가요? 뼈아픈 실패를 막고 진짜 성과를 만드는 실행의 법칙을
                제품 가장 깊숙한 곳에 담아냈어요.
              </p>
            </div>

            <div className="grid gap-5">
              {TERM_EXPLANATIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.label}
                    className="group rounded-[28px] border border-border bg-white px-6 py-7 transition-all hover:shadow-[0_12px_40px_rgba(17,24,39,0.04)] hover:border-border/80"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-5">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${item.tone}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-1">
                            {item.label}
                          </p>
                          <h3 className="text-[22px] leading-[1.2] font-bold tracking-tight text-text-primary">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-[15px] leading-relaxed text-text-secondary">
                          {item.description}
                        </p>
                        <div className="inline-flex items-center gap-2 rounded-lg bg-background px-3 py-2 mt-2">
                          <span className="text-[10px] font-bold uppercase text-text-muted">
                            Formula
                          </span>
                          <span className="text-[13px] font-medium text-text-primary">
                            {item.example}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Execution Loop */}
        <section
          id="execution-loop"
          className="relative z-10 border-t border-border py-20"
        >
          <div className="text-center max-w-[600px] mx-auto mb-16 space-y-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Execution Loop
            </p>
            <h2 className="font-inter text-[36px] leading-[1.25] font-bold tracking-[-0.04em] text-text-primary md:text-[46px]">
              선명하게 정하고,
              <br />
              꾸준하게 행동하며,
              <br />
              객관적으로 돌아봐요.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 01 */}
            <Card className="flex flex-col rounded-[28px] border border-border bg-white overflow-hidden">
              <div className="p-6 pb-0 flex-1">
                <p className="text-[32px] font-bold tracking-[-0.05em] text-text-muted/30 mb-2 font-mono">
                  01
                </p>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  Focus
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  이번 주, 우리 팀이 다 함께 이루고 싶은 단 하나의 목표를
                  선명하게 그려요.
                </p>
              </div>
              <div className="p-6 mt-4">
                <div className="rounded-xl border border-primary/10 bg-[#eef0ff]/50 p-4 h-[110px] flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="text-xs font-bold text-primary">WIG</p>
                  </div>
                  <p className="text-[13px] font-semibold text-text-primary">
                    Q3 핵심 지표 리텐션 40% 달성
                  </p>
                  <div className="mt-auto flex items-center justify-between text-[11px] text-text-muted">
                    <span>후행지표</span>
                    <span className="font-medium text-text-secondary">
                      WAU 1.5배 증가
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 02 */}
            <Card className="flex flex-col rounded-[28px] border border-border bg-white overflow-hidden">
              <div className="p-6 pb-0 flex-1">
                <p className="text-[32px] font-bold tracking-[-0.05em] text-text-muted/30 mb-2 font-mono">
                  02
                </p>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  Lead
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  결과를 만들어 낼 작지만 확실한 행동들을 매일 조금씩 실천하고
                  기록해요.
                </p>
              </div>
              <div className="p-6 mt-4">
                <div className="rounded-xl border border-success/10 bg-[#eef8f1]/50 p-4 h-[110px] flex flex-col justify-center">
                  <p className="text-[11px] font-semibold text-success mb-3">
                    Today&apos;s Actions
                  </p>
                  <div className="flex gap-1.5 justify-between">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <div
                        key={i}
                        className={`flex h-8 w-8 items-center justify-center rounded border ${i <= 4 ? "border-success/30 bg-success/10 text-success" : "border-border bg-white text-border"}`}
                      >
                        {i <= 4 && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 03 */}
            <Card className="flex flex-col rounded-[28px] border border-border bg-white overflow-hidden">
              <div className="p-6 pb-0 flex-1">
                <p className="text-[32px] font-bold tracking-[-0.05em] text-text-muted/30 mb-2 font-mono">
                  03
                </p>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  Review
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  한 주를 마치며 지난 성적을 솔직하게 마주하고, 다음 주 한 걸음
                  더 나아갈 방향을 찾아요.
                </p>
              </div>
              <div className="p-6 mt-4">
                <div className="rounded-xl border border-[#ea7a16]/10 bg-[#fff5ea]/50 p-4 h-[110px] flex flex-col justify-center">
                  <div className="flex items-end justify-between mb-3 mt-1">
                    <p className="text-[11px] font-semibold text-[#ea7a16]">
                      Weekly Score
                    </p>
                    <p className="text-2xl font-bold font-mono text-text-primary leading-none">
                      80<span className="text-sm">%</span>
                    </p>
                  </div>
                  <div className="h-1.5 w-full bg-border/50 rounded-full overflow-hidden mt-auto mb-2">
                    <div className="h-full bg-[#ea7a16] w-[80%] rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 6. Feature Grid */}
        <section className="relative z-10 border-t border-border py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Features
              </p>
              <h2 className="max-w-[360px] font-inter text-[36px] leading-[1.2] font-bold tracking-[-0.04em] text-text-primary md:text-[40px]">
                복잡함은 비우고,
                <br />
                본질만 남긴 도구
              </h2>
              <p className="text-[16px] leading-relaxed text-text-secondary max-w-[340px] pt-2">
                꼭 필요한 기능만 담아 팀의 에너지를 아껴줘요. 도구를 배우느라
                지치지 않게, 직관적이고 가볍게 만들었어요.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {FEATURES.map((feat) => {
                const Icon = feat.icon;
                return (
                  <Card
                    key={feat.title}
                    className="rounded-[24px] border border-border bg-white p-6 transition-colors hover:border-primary/20"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border text-text-primary mb-5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-[17px] font-bold text-text-primary mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-[14px] leading-[1.6] text-text-secondary">
                      {feat.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. CTA Footer */}
        <section className="relative z-10 border-t border-border pt-20 pb-10 text-center">
          <div className="max-w-[600px] mx-auto space-y-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-2">
              <Zap className="h-8 w-8" />
            </div>
            <h2 className="font-inter text-[38px] leading-[1.2] font-bold tracking-[-0.04em] text-text-primary">
              진짜 중요한 목표에 집중할 준비,
              <br />
              되셨나요?
            </h2>
            <p className="text-[17px] text-text-secondary">
              초기 설정은 단 2분이면 충분해요.
              <br />
              관리에 들이는 에너지는 덜어내고, 결과를 만드는 행동에만 집중해
              보세요.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                className="btn-linear-primary inline-flex h-14 items-center justify-center rounded-full px-8 text-[16px] font-bold transition-all min-w-[200px]"
              >
                <Link href="/login">지금, 무료로 시작하기</Link>
              </Button>
            </div>
            <p className="text-[12px] text-text-muted mt-8">
              © 2026 WIG. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
