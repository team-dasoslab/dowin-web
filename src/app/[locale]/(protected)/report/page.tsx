"use client";

import {
  TeamDashboardMember,
  TeamWeeklyReportTrend,
} from "@/api/generated/wig.schemas";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import { formatWeekLabel } from "@/app/[locale]/(protected)/dashboard/_lib/dashboard";
import { useTeamWeeklyReport } from "@/app/[locale]/(protected)/report/_hooks/useTeamWeeklyReport";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/routing";
import { ArrowRight, BarChart3, CalendarDays, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FocusMember = {
  key: string;
  name: string;
  status: string;
  score: string;
  nextAction: string;
  badgeTone: string;
};

const getMemberName = (member: TeamDashboardMember) =>
  member.nickname?.trim() || "이름 없음";

const formatScore = (member: TeamDashboardMember) => {
  if (!member.hasScoreboard) return "설정 전";
  return `${member.achieved ?? 0} / ${member.total ?? 0}`;
};

const buildReportSummary = (members: TeamDashboardMember[]) => {
  const activeMembers = members.filter((m) => m.hasScoreboard);
  const noScoreboardMembers = members.filter((m) => !m.hasScoreboard);
  const winningMembers = activeMembers.filter((m) => m.isWinning);
  const startedMembers = activeMembers.filter((m) => (m.achieved ?? 0) > 0);
  const notStartedMembers = activeMembers.filter(
    (m) => (m.achieved ?? 0) === 0,
  );
  const losingStartedMembers = activeMembers.filter(
    (m) => !m.isWinning && (m.achieved ?? 0) > 0,
  );
  const immediateCheckCount =
    noScoreboardMembers.length + notStartedMembers.length;
  const noScoreboardNames = noScoreboardMembers.map(getMemberName);
  const winningNames = winningMembers.map(getMemberName);
  const losingStartedNames = losingStartedMembers.map(getMemberName);
  const notStartedNames = notStartedMembers.map(getMemberName);

  const focusMembers: FocusMember[] = [
    ...noScoreboardMembers.map((m) => ({
      key: `no-scoreboard-${m.userId ?? getMemberName(m)}`,
      name: getMemberName(m),
      status: "점수판 없음",
      score: "설정 전",
      nextAction: "WIG와 선행지표 설정부터 열어주기",
      badgeTone: "border-border bg-sub-background text-text-secondary",
    })),
    ...notStartedMembers.map((m) => ({
      key: `not-started-${m.userId ?? getMemberName(m)}`,
      name: getMemberName(m),
      status: "이번 주 미기록",
      score: formatScore(m),
      nextAction: "이번 주 시작 가능한 가장 작은 행동부터 확인",
      badgeTone: "border-amber-200 bg-amber-50 text-amber-700",
    })),
    ...losingStartedMembers.map((m) => ({
      key: `losing-${m.userId ?? getMemberName(m)}`,
      name: getMemberName(m),
      status: "시작했지만 밀리는 중",
      score: formatScore(m),
      nextAction: "선행지표 난이도나 이번 주 실행 리듬 확인",
      badgeTone: "border-[rgba(94,106,210,0.3)] bg-[rgba(94,106,210,0.06)] text-[#5e6ad2]",
    })),
  ].slice(0, 3);

  return {
    totalCount: members.length,
    activeCount: activeMembers.length,
    winningCount: winningMembers.length,
    startedCount: startedMembers.length,
    noScoreboardCount: noScoreboardMembers.length,
    notStartedCount: notStartedMembers.length,
    losingStartedCount: losingStartedMembers.length,
    immediateCheckCount,
    noScoreboardNames,
    winningNames,
    losingStartedNames,
    notStartedNames,
    focusMembers,
    winRate:
      activeMembers.length > 0
        ? winningMembers.length / activeMembers.length
        : 0,
  };
};

export default function ReportPage() {
  const { report, hasNoWorkspace, isForbidden, isLoading } =
    useTeamWeeklyReport();

  if (isLoading) return <ReportLoadingState />;
  if (hasNoWorkspace) return <ReportNoWorkspaceState />;
  if (isForbidden) return <ReportForbiddenState />;
  if (!report) return <ReportLoadingState />;

  const members = report.members ?? [];
  const summary = buildReportSummary(members);
  const weekLabel =
    report.weekStart && report.weekEnd
      ? formatWeekLabel(report.weekStart, report.weekEnd)
      : "이번 주";
  const workspaceName = report.workspaceName ?? "워크스페이스";
  const hasActive = summary.activeCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[860px] space-y-8 px-4 py-6 md:px-8 md:py-10">

        {/* 헤더 */}
        <header className="space-y-4 px-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <Users className="h-3.5 w-3.5 text-[#626A7D]" />
            <span className="font-medium text-text-secondary">{workspaceName}</span>
            <span className="text-border">·</span>
            <CalendarDays className="h-3.5 w-3.5 text-[#626A7D]" />
            <span className="font-mono rounded border border-border bg-sub-background px-2 py-0.5 text-[11px] tracking-tight">
              {weekLabel}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary md:text-2xl">
              {hasActive
                ? `이번 주 팀은 ${summary.activeCount}명 중 ${summary.winningCount}명이 이기고 있어요.`
                : "아직 활성 점수판이 없어 팀 승패를 계산할 수 없어요."}
            </h1>
            <p className="text-sm leading-6 text-text-secondary">
              {summary.immediateCheckCount > 0
                ? `아직 시작하지 않은 ${summary.notStartedCount}명과 점수판이 없는 ${summary.noScoreboardCount}명이 있어 먼저 확인이 필요합니다.`
                : "이번 주 기록이 모두 시작됐습니다. 팀 대시보드에서 세부 선행지표 흐름을 이어서 확인하세요."}
            </p>
          </div>
        </header>

        {/* 팀 상태 한눈에 보기 */}
        <section className="space-y-3">
          <SectionLabel title="팀 현황" />
          <Card className="overflow-hidden rounded-lg border border-border bg-white">
            {/* Win Rate 시각화 */}
            {hasActive && (
              <div className="px-5 py-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-text-primary">
                      이번 주 승률
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      활성 점수판 기준으로 이번 주 팀 상태를 나눠서 보여줍니다.
                    </p>
                  </div>
                  <TrendingUp className="h-4 w-4 shrink-0 text-[#5e6ad2]" />
                </div>
                <WinRateOverview
                  winningCount={summary.winningCount}
                  losingCount={summary.losingStartedCount}
                  notStartedCount={summary.notStartedCount}
                  noScoreboardCount={summary.noScoreboardCount}
                  activeCount={summary.activeCount}
                  totalCount={summary.totalCount}
                  winningNames={summary.winningNames}
                  losingNames={summary.losingStartedNames}
                  notStartedNames={summary.notStartedNames}
                  noScoreboardNames={summary.noScoreboardNames}
                />
              </div>
            )}
          </Card>
        </section>

        {/* 팀 추세 차트 */}
        <TeamTrendChart
          trends={report.trends ?? []}
        />

        {/* E. 개입 대상 목록 */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2 px-1">
            <SectionLabel
              title="먼저 확인할 팀원"
              desc="운영 우선순위 기준으로 정렬됩니다"
              inline
            />
          </div>

          {summary.focusMembers.length > 0 ? (
            <FocusMemberList members={summary.focusMembers} />
          ) : (
            <div className="rounded-lg border border-border bg-sub-background px-5 py-8 text-center">
              <p className="text-sm font-semibold text-text-primary">
                이번 주 바로 확인해야 할 팀원이 없습니다.
              </p>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                팀 대시보드에서 선행지표별 세부 흐름만 점검하면 됩니다.
              </p>
            </div>
          )}
        </section>

        {/* 하단 CTA */}
        <div className="border-t border-border pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
          <div>
            <p className="text-sm font-bold text-text-primary">더 자세히 보려면</p>
            <p className="mt-0.5 text-xs text-text-muted">
              팀 대시보드에서 선행지표 흐름을 이어서 확인하세요.
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[rgba(94,106,210,0.3)] bg-[rgba(94,106,210,0.06)] px-3 py-2 text-xs font-bold text-[#5e6ad2] transition-colors hover:bg-[rgba(94,106,210,0.1)] hover:border-[rgba(94,106,210,0.4)]"
          >
            <Link href="/dashboard">
              팀 대시보드 보기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}

// ─── TeamTrendChart ────────────────────────────────────────────────────────────

type ChartLegendKey = "winRate" | "execRate" | null;

function ChartLegendTooltip({
  active,
  label,
  description,
  color,
  onToggle,
  onClose,
}: {
  active: boolean;
  label: string;
  description: string;
  color: string;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-[11px] text-text-muted transition-colors hover:text-text-primary"
      >
        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </button>
      {active && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-border bg-white p-4 shadow-lg">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-primary">{label}</p>
            <p className="text-[11px] leading-relaxed text-text-secondary">{description}</p>
          </div>
        </>
      )}
    </div>
  );
}

function TeamTrendChart({ trends }: { trends: TeamWeeklyReportTrend[] }) {
  const [activeTooltip, setActiveTooltip] = useState<ChartLegendKey>(null);
  const data = trends.map((trend, index) => ({
    week:
      index === trends.length - 1
        ? "이번 주"
        : formatShortWeekLabel(trend.weekStart),
    winRate: trend.winRate ?? 0,
    execRate: trend.executionRate ?? 0,
  }));

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-text-primary">팀 승률 추이</h2>
          <p className="text-xs text-text-muted">최근 주차별 실제 팀 승률과 실행률입니다</p>
        </div>
        <div className="flex items-center gap-3">
          <ChartLegendTooltip
            active={activeTooltip === "winRate"}
            label="승률"
            description="활성 점수판 팀원 중 이번 주 목표 pace를 넘긴 비율입니다. 전체 팀원이 아닌 점수판이 있는 멤버 기준입니다."
            color="#5e6ad2"
            onToggle={() => setActiveTooltip(activeTooltip === "winRate" ? null : "winRate")}
            onClose={() => setActiveTooltip(null)}
          />
          <ChartLegendTooltip
            active={activeTooltip === "execRate"}
            label="실행률"
            description="활성 점수판 팀원 중 이번 주 선행지표를 1건 이상 기록한 비율입니다. 시작 여부를 측정하는 지표입니다."
            color="#84cc16"
            onToggle={() => setActiveTooltip(activeTooltip === "execRate" ? null : "execRate")}
            onClose={() => setActiveTooltip(null)}
          />
        </div>
      </div>
      <Card className="overflow-hidden rounded-lg border border-border bg-white px-2 py-5">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5e6ad2" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#5e6ad2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#84cc16" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-sm">
                    <p className="mb-1.5 text-[11px] font-bold text-text-primary">{label}</p>
                    {payload.map((entry) => (
                      <p key={entry.dataKey as string} className="text-[11px] text-text-muted">
                        <span
                          className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.dataKey === "winRate" ? "승률" : "실행률"}:{" "}
                        <span className="font-mono font-bold text-text-primary">{entry.value}%</span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="winRate"
              stroke="#5e6ad2"
              strokeWidth={2}
              fill="url(#winGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#5e6ad2", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="execRate"
              stroke="#84cc16"
              strokeWidth={1.5}
              fill="url(#execGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#84cc16", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </section>
  );
}

function formatShortWeekLabel(weekStart?: string) {
  if (!weekStart) return "-";

  const [, month, day] = weekStart.split("-");
  return `${Number(month)}/${Number(day)}주`;
}

// ─── WinRateOverview ───────────────────────────────────────────────────────

function WinRateOverview({
  winningCount,
  losingCount,
  notStartedCount,
  noScoreboardCount,
  activeCount,
  totalCount,
  winningNames,
  losingNames,
  notStartedNames,
  noScoreboardNames,
}: {
  winningCount: number;
  losingCount: number;
  notStartedCount: number;
  noScoreboardCount: number;
  activeCount: number;
  totalCount: number;
  winningNames: string[];
  losingNames: string[];
  notStartedNames: string[];
  noScoreboardNames: string[];
}) {
  if (totalCount === 0) return null;

  const winRate = activeCount > 0 ? Math.round((winningCount / activeCount) * 100) : 0;
  const statusHeadline =
    activeCount === 0
      ? "아직 이번 주 승률을 볼 활성 점수판이 없습니다."
      : winningCount === 0
        ? "아직 이기는 팀원이 없습니다."
        : winningCount === activeCount
          ? "활성 점수판 멤버 전원이 이기고 있어요."
          : `${winningCount}명이 현재 이기고 있어요.`;
  const statusSubline =
    noScoreboardCount > 0
      ? `점수판 없는 ${noScoreboardCount}명부터 먼저 정리하는 게 좋습니다.`
      : notStartedCount > 0
        ? `이번 주 미시작 ${notStartedCount}명 확인이 먼저 필요합니다.`
        : losingCount > 0
          ? `밀리는 ${losingCount}명의 실행 흐름 점검이 필요합니다.`
          : "활성 점수판 기준으로 이번 주 흐름이 안정적입니다.";
  const statusCards = [
    {
      label: "이기는 중",
      caption: "이번 주 pace를 넘기고 있어요",
      count: winningCount,
      names: winningNames,
      color: "bg-[#5e6ad2]",
      ring: "border-[rgba(94,106,210,0.2)]",
      surface: "bg-[rgba(94,106,210,0.04)]",
      valueTone: "text-[#5e6ad2]",
    },
    {
      label: "밀리는 중",
      caption: "기록은 했지만 아직 부족해요",
      count: losingCount,
      names: losingNames,
      color: "bg-amber-400",
      ring: "border-amber-200",
      surface: "bg-amber-50/50",
      valueTone: "text-amber-700",
    },
    {
      label: "미시작",
      caption: "이번 주 기록이 아직 없어요",
      count: notStartedCount,
      names: notStartedNames,
      color: "bg-[rgba(156,163,175,1)]",
      ring: "border-[rgba(226,228,233,1)]",
      surface: "bg-sub-background",
      valueTone: "text-text-secondary",
    },
    {
      label: "점수판 없음",
      caption: "아직 경기에 들어오지 않았어요",
      count: noScoreboardCount,
      names: noScoreboardNames,
      color: "bg-[rgba(226,228,233,1)]",
      ring: "border-[rgba(226,228,233,1)]",
      surface: "bg-sub-background",
      valueTone: "text-text-muted",
    },
  ];

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-[rgba(94,106,210,0.15)] bg-[rgba(94,106,210,0.03)] px-4 py-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5e6ad2]">
            이번 주 팀 상태 요약
          </p>
          <p className="text-lg font-bold tracking-tight text-text-primary md:text-xl">
            {statusHeadline}
          </p>
          <p className="text-sm text-text-secondary">
            {statusSubline}
          </p>
          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold text-text-muted">
                활성 점수판 기준 승률
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-lg font-bold tracking-tight text-[#5e6ad2]">
                  {winRate}%
                </span>
                <span className="text-xs text-text-muted">
                  {winningCount} / {activeCount}
                </span>
              </div>
            </div>
            <div className="rounded-md border border-border bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold text-text-muted">
                전체 팀원
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-lg font-bold tracking-tight text-text-primary">
                  {totalCount}명
                </span>
                <span className="text-xs text-text-muted">
                  이번 주 전체 기준
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {statusCards.map((card) => (
          <StatusBoardCard
            key={card.label}
            label={card.label}
            caption={card.caption}
            count={card.count}
            names={card.names}
            color={card.color}
            ring={card.ring}
            surface={card.surface}
            valueTone={card.valueTone}
          />
        ))}
      </div>
    </div>
  );
}

function StatusBoardCard({
  label,
  caption,
  count,
  names,
  color,
  ring,
  surface,
  valueTone,
}: {
  label: string;
  caption: string;
  count: number;
  names: string[];
  color: string;
  ring: string;
  surface: string;
  valueTone: string;
}) {
  const COLLAPSED_MAX = 4;
  const [expanded, setExpanded] = useState(false);
  const hasMore = names.length > COLLAPSED_MAX;
  const shownNames = expanded ? names : names.slice(0, COLLAPSED_MAX);

  return (
    <div className={`rounded-xl border px-4 py-4 ${ring} ${surface}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            <p className="text-sm font-semibold text-text-primary">{label}</p>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-text-muted">
            {caption}
          </p>
        </div>
        <div className={`font-mono text-2xl font-bold tracking-tight ${valueTone}`}>
          {count}
        </div>
      </div>

      <div className="mt-4">
        {shownNames.length > 0 ? (
          <div>
            <div className="flex flex-wrap gap-2">
              {shownNames.map((name) => (
                <span
                  key={`${label}-${name}`}
                  className="rounded-full border border-white/70 bg-white px-2.5 py-1 text-xs font-medium text-text-primary shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                >
                  {name}
                </span>
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-2 text-xs font-semibold text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
              >
                {expanded ? "접기" : `더보기 (${names.length}명)`}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-muted">해당 팀원이 없습니다</p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({
  title,
  desc,
  inline = false,
}: {
  title: string;
  desc?: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="space-y-0.5">
        <h2 className="text-sm font-bold text-text-primary">{title}</h2>
        {desc && <p className="text-xs text-text-muted">{desc}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-0.5 px-1">
      <h2 className="text-sm font-bold text-text-primary">{title}</h2>
      {desc && <p className="text-xs text-text-muted">{desc}</p>}
    </div>
  );
}

// ─── FocusMemberList ─────────────────────────────────────────────────────────

function FocusMemberList({ members }: { members: FocusMember[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      {/* 데스크탑 헤더 */}
      <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1.2fr)] gap-4 border-b border-border bg-sub-background px-5 py-3 text-[11px] font-semibold text-text-muted md:grid">
        <span>팀원</span>
        <span>상태</span>
        <span>현재 점수</span>
        <span>다음 액션</span>
      </div>

      <div className="divide-y divide-border">
        {members.map((member, idx) => (
          <div
            key={member.key}
            className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1.2fr)] md:items-center md:gap-4"
          >
            {/* 이름 + 우선순위 번호 */}
            <div className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-sub-background font-mono text-[11px] font-bold text-text-muted">
                {idx + 1}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-semibold tracking-tight text-text-primary">
                  {member.name}
                </p>
                <p className="text-xs text-text-muted md:hidden">
                  현재 점수 {member.score}
                </p>
              </div>
            </div>

            <div>
              <Badge
                className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${member.badgeTone}`}
              >
                {member.status}
              </Badge>
            </div>

            <div className="hidden font-mono text-sm font-semibold text-text-primary md:block">
              {member.score}
            </div>

            <p className="text-xs leading-5 text-text-muted">
              {member.nextAction}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 상태 컴포넌트 ────────────────────────────────────────────────────────────

function ReportLoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[860px] space-y-8 px-4 py-6 md:px-8 md:py-10 animate-pulse">
        <div className="space-y-3 px-1">
          <div className="h-4 w-40 rounded bg-sub-background" />
          <div className="h-7 w-72 rounded bg-sub-background" />
          <div className="h-4 w-56 rounded bg-sub-background" />
        </div>
        <div className="h-48 rounded-lg bg-sub-background" />
        <div className="h-40 rounded-lg bg-sub-background" />
      </div>
    </div>
  );
}

function ReportNoWorkspaceState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] p-4 md:p-8">
        <Card className="card-linear space-y-4 p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            주간 리포트를 만들 워크스페이스가 없습니다
          </h1>
          <p className="text-sm text-text-secondary">
            워크스페이스를 만들거나 초대코드로 참가한 뒤 팀 리포트를 확인할 수
            있습니다.
          </p>
          <div className="flex justify-center">
            <NoWorkspaceActions />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportForbiddenState() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] p-4 md:p-8">
        <Card className="card-linear space-y-4 p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            리더만 주간 리포트를 볼 수 있습니다
          </h1>
          <p className="text-sm text-text-secondary">
            이 화면은 워크스페이스 관리자에게만 공개됩니다.
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/dashboard">팀 대시보드로 돌아가기</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
