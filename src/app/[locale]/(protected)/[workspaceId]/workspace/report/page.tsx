"use client";

import {
  TeamDashboardMember,
  TeamWeeklyReportTrend,
} from "@/api/generated/dowin.schemas";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { PageSidebarNav } from "@/components/PageSidebarNav";
import { formatWeekLabel } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_lib/dashboard";
import { useTeamWeeklyReport } from "@/app/[locale]/(protected)/[workspaceId]/workspace/report/_hooks/useTeamWeeklyReport";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { PeriodBadge } from "@/components/ui/PeriodBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/routing";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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

type ReportSummaryCopy = {
  unnamedMember: string;
  unsetScore: string;
  noScoreboardStatus: string;
  noScoreboardAction: string;
  notStartedStatus: string;
  notStartedAction: string;
  losingStartedStatus: string;
  losingStartedAction: string;
};

const getMemberName = (member: TeamDashboardMember, fallback: string) =>
  member.nickname?.trim() || fallback;

const formatScore = (member: TeamDashboardMember, unsetScore: string) => {
  if (!member.hasScoreboard) return unsetScore;
  return `${member.achieved ?? 0} / ${member.total ?? 0}`;
};

const buildReportSummary = (
  members: TeamDashboardMember[],
  copy: ReportSummaryCopy,
) => {
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
  const noScoreboardNames = noScoreboardMembers.map((member) =>
    getMemberName(member, copy.unnamedMember),
  );
  const winningNames = winningMembers.map((member) =>
    getMemberName(member, copy.unnamedMember),
  );
  const losingStartedNames = losingStartedMembers.map((member) =>
    getMemberName(member, copy.unnamedMember),
  );
  const notStartedNames = notStartedMembers.map((member) =>
    getMemberName(member, copy.unnamedMember),
  );

  const focusMembers: FocusMember[] = [
    ...noScoreboardMembers.map((m) => ({
      key: `no-scoreboard-${m.userId ?? getMemberName(m, copy.unnamedMember)}`,
      name: getMemberName(m, copy.unnamedMember),
      status: copy.noScoreboardStatus,
      score: copy.unsetScore,
      nextAction: copy.noScoreboardAction,
      badgeTone: "border-border bg-sub-background text-text-secondary",
    })),
    ...notStartedMembers.map((m) => ({
      key: `not-started-${m.userId ?? getMemberName(m, copy.unnamedMember)}`,
      name: getMemberName(m, copy.unnamedMember),
      status: copy.notStartedStatus,
      score: formatScore(m, copy.unsetScore),
      nextAction: copy.notStartedAction,
      badgeTone: "border-amber-200 bg-amber-50 text-amber-700",
    })),
    ...losingStartedMembers.map((m) => ({
      key: `losing-${m.userId ?? getMemberName(m, copy.unnamedMember)}`,
      name: getMemberName(m, copy.unnamedMember),
      status: copy.losingStartedStatus,
      score: formatScore(m, copy.unsetScore),
      nextAction: copy.losingStartedAction,
      badgeTone:
        "border-primary/30 bg-primary/6 text-primary",
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
  const t = useTranslations("Report");
  const tDashboard = useTranslations("Dashboard");
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { report, hasNoWorkspace, isError, isForbidden, isLoading, refetch } =
    useTeamWeeklyReport(workspaceId);
  const hasTrackedViewRef = useRef(false);

  const [activeSection, setActiveSection] = useState("status");

  const menuGroups = useMemo(
    () => [
      { id: "status", label: t("sections.teamStatus") },
      { id: "trend", label: t("trend.title") },
      { id: "focus", label: t("focus.title") },
    ],
    [t],
  );

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById("main-scroll-container");
      if (!container) return;
      const scrollPosition = container.scrollTop + 150;
      let currentSectionId = activeSection;

      for (const group of menuGroups) {
        const el = document.getElementById(group.id);
        if (el && el.offsetTop <= scrollPosition) {
          currentSectionId = group.id;
        }
      }

      if (currentSectionId !== activeSection) {
        setActiveSection(currentSectionId);
      }
    };

    const container = document.getElementById("main-scroll-container");
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [activeSection, menuGroups]);

  useEffect(() => {
    if (isLoading || hasNoWorkspace || !report || hasTrackedViewRef.current) {
      return;
    }

    const memberCount = report.members?.length ?? 0;
    const memberCountBucket =
      memberCount <= 1
        ? "1"
        : memberCount <= 5
          ? "2_5"
          : memberCount <= 15
            ? "6_15"
            : "16_plus";

    trackEvent("team_report_viewed", {
      member_count_bucket: memberCountBucket,
      workspace_id_hash: hashId(report.workspaceId),
    });
    hasTrackedViewRef.current = true;
  }, [report, hasNoWorkspace, isLoading]);

  if (isLoading) return <ReportLoadingState />;
  if (hasNoWorkspace) return <ReportNoWorkspaceState />;
  if (isForbidden) return <ReportForbiddenState workspaceId={workspaceId} />;
  if (isError || !report) return <ReportErrorState onRetry={refetch} workspaceId={workspaceId} />;

  const members = report.members ?? [];
  const summary = buildReportSummary(members, {
    unnamedMember: t("common.unnamedMember"),
    unsetScore: t("common.unsetScore"),
    noScoreboardStatus: t("focus.status.noScoreboard"),
    noScoreboardAction: t("focus.action.noScoreboard"),
    notStartedStatus: t("focus.status.notStarted"),
    notStartedAction: t("focus.action.notStarted"),
    losingStartedStatus: t("focus.status.losingStarted"),
    losingStartedAction: t("focus.action.losingStarted"),
  });
  const weekLabel =
    report.weekStart && report.weekEnd
      ? formatWeekLabel(report.weekStart, report.weekEnd)
      : t("common.thisWeek");
  const hasActive = summary.activeCount > 0;
  const hasMembers = summary.totalCount > 0;

  return (
    <div className="min-h-screen bg-zinc-100">
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader
          title={tDashboard("weeklyReport")}
          rightElement={
            <div className="flex items-center gap-2">
              <PeriodBadge label={weekLabel} size="md" />
            </div>
          }
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          <PageSidebarNav
            items={menuGroups.map((group) => ({ id: group.id, label: group.label }))}
            activeId={activeSection}
          />

          {/* ── 우측 메인 콘텐츠 ── */}
          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-[60vh]">
            <section id="status" className="space-y-5 scroll-mt-28">
              <SectionHeader title={t("sections.teamStatus")} />
              {hasMembers ? (
                <div className="space-y-3">
                  {hasActive ? (
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
                  ) : (
                    <InlineEmptyState
                      title={t("empty.noActiveScoreboardsTitle")}
                      description={t("empty.noActiveScoreboardsDesc")}
                    />
                  )}
                </div>
              ) : (
                <InlineEmptyState
                  title={t("empty.noMembersTitle")}
                  description={t("empty.noMembersDesc")}
                />
              )}
            </section>

            <section id="trend" className="space-y-5 scroll-mt-28">
              <SectionHeader
                title={t("trend.title")}
                description={t("trend.desc")}
              />
              <Card className="overflow-visible p-6 sm:p-8 border border-zinc-200 bg-white">
                <div className="h-[300px] w-full">
                  <TeamTrendChart trends={report.trends ?? []} />
                </div>
              </Card>
            </section>

            <section id="focus" className="space-y-5 scroll-mt-28">
              <SectionHeader
                title={t("focus.title")}
                description={t("focus.desc")}
              />

              {summary.focusMembers.length > 0 ? (
                <FocusMemberList members={summary.focusMembers} />
              ) : (
                <InlineEmptyState
                  title={t("focus.emptyTitle")}
                  description={t("focus.emptyDesc")}
                />
              )}
            </section>
          </div>
        </div>
      </ProtectedPageContainer>
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
        onMouseEnter={onToggle}
        onMouseLeave={onClose}
        className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted transition-colors"
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
        <DowinIcon name="status-info" size={10} className="text-zinc-300 ml-0.5" />
      </button>
      {active && (
        <>
          <div className="fixed inset-0 z-10 sm:hidden" onClick={onClose} />
          <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-content border border-border bg-white p-4 shadow-xl animate-dowin-in">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-primary">
              {label}
            </p>
            <p className="text-[11px] leading-relaxed text-text-secondary">
              {description}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function TeamTrendChart({
  trends,
  workspaceId,
}: {
  trends: TeamWeeklyReportTrend[];
  workspaceId?: number;
}) {
  const t = useTranslations("Report");
  const [activeTooltip, setActiveTooltip] = useState<ChartLegendKey>(null);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const data = trends.map((trend, index) => ({
    week:
      index === trends.length - 1
        ? t("common.thisWeek")
        : formatShortWeekLabel(trend.weekStart, t),
    winRate: trend.winRate ?? 0,
    execRate: trend.executionRate ?? 0,
  }));
  const hasTrendData = data.length > 0;

  if (!isMounted) return null;

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center gap-x-4">
        <ChartLegendTooltip
          active={activeTooltip === "winRate"}
          label={t("trend.winRateLabel")}
          description={t("trend.winRateDesc")}
          color="#3a64c7"
          onToggle={() => {
            const next = activeTooltip === "winRate" ? null : "winRate";
            setActiveTooltip(next);
            if (next) {
              trackEvent("team_report_trend_legend_clicked", {
                legend_type: "winRate",
                workspace_id_hash: hashId(workspaceId),
              });
            }
          }}
          onClose={() => setActiveTooltip(null)}
        />
        <ChartLegendTooltip
          active={activeTooltip === "execRate"}
          label={t("trend.executionRateLabel")}
          description={t("trend.executionRateDesc")}
          color="#84cc16"
          onToggle={() => {
            const next = activeTooltip === "execRate" ? null : "execRate";
            setActiveTooltip(next);
            if (next) {
              trackEvent("team_report_trend_legend_clicked", {
                legend_type: "execRate",
                workspace_id_hash: hashId(workspaceId),
              });
            }
          }}
          onClose={() => setActiveTooltip(null)}
        />
      </div>

      <div className="flex-1 min-h-[200px]">
        {hasTrendData ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 10, height: 10 }}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3a64c7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3a64c7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#84cc16" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#9ca3af", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                ticks={[0, 50, 100]}
              />
              <Tooltip
                cursor={{ stroke: "rgba(58, 100, 199, 0.1)", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
                      <p className="mb-2 text-[11px] font-bold text-text-primary">
                        {label}
                      </p>
                      <div className="space-y-1.5">
                        {payload.map((entry) => (
                          <div
                            key={entry.dataKey as string}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-[11px] font-medium text-text-secondary">
                                {entry.dataKey === "winRate"
                                  ? t("trend.winRateLabel")
                                  : t("trend.executionRateLabel")}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-text-primary">
                              {entry.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="winRate"
                stroke="#3a64c7"
                strokeWidth={2.5}
                fill="url(#winGrad)"
                dot={{ r: 3, fill: "#fff", stroke: "#3a64c7", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#3a64c7", stroke: "#fff", strokeWidth: 2 }}
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="execRate"
                stroke="#84cc16"
                strokeWidth={2}
                fill="url(#execGrad)"
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4, fill: "#84cc16", stroke: "#fff", strokeWidth: 2 }}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-text-primary">
              {t("empty.noTrendTitle")}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {t("empty.noTrendDesc")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatShortWeekLabel(
  weekStart: string | undefined,
  t: ReturnType<typeof useTranslations<"Report">>,
) {
  if (!weekStart) return "-";

  const [, month, day] = weekStart.split("-");
  return t("trend.shortWeekLabel", {
    month: Number(month),
    day: Number(day),
  });
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
  const t = useTranslations("Report");
  const [showInfo, setShowInfo] = useState(false);
  if (totalCount === 0) return null;

  const winRate =
    activeCount > 0 ? Math.round((winningCount / activeCount) * 100) : 0;
  const statusHeadline =
    activeCount === 0
      ? t("winOverview.headline.noActive")
      : winningCount === 0
        ? t("winOverview.headline.noWinning")
        : winningCount === activeCount
          ? t("winOverview.headline.allWinning")
          : t("winOverview.headline.someWinning", { winningCount });
  const statusSubline =
    noScoreboardCount > 0
      ? t("winOverview.subline.noScoreboard", { noScoreboardCount })
      : notStartedCount > 0
        ? t("winOverview.subline.notStarted", { notStartedCount })
        : losingCount > 0
          ? t("winOverview.subline.losing", { losingCount })
          : t("winOverview.subline.stable");
  const statusCards = [
    {
      label: t("statusCards.winning.label"),
      count: winningCount,
      names: winningNames,
      color: "bg-primary",
      indicator: "bg-primary",
    },
    {
      label: t("statusCards.losing.label"),
      count: losingCount,
      names: losingNames,
      color: "bg-amber-400",
      indicator: "bg-amber-400",
    },
    {
      label: t("statusCards.notStarted.label"),
      count: notStartedCount,
      names: notStartedNames,
      color: "bg-zinc-400",
      indicator: "bg-zinc-400",
    },
    {
      label: t("statusCards.noScoreboard.label"),
      count: noScoreboardCount,
      names: noScoreboardNames,
      color: "bg-zinc-200",
      indicator: "bg-zinc-200",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className="relative overflow-visible border border-zinc-200 bg-white">
        {/* Clipped background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-content">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative flex flex-col p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center px-2.5 py-1 rounded-button border border-primary/10 bg-primary/5 text-primary text-[11px] font-bold tracking-tight shadow-sm shadow-primary/5">
                {t("winOverview.summaryLabel")}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl leading-[1.15]">
                  {statusHeadline}
                </h2>
                <p className="text-[15px] font-medium text-text-secondary leading-relaxed max-w-2xl">
                  {statusSubline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8 md:gap-12 shrink-0 border-t border-zinc-100 pt-6 md:border-t-0 md:pt-0">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  {t("winOverview.totalMembers")}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold tracking-tight text-text-primary">
                    {totalCount}
                  </span>
                  <span className="text-xs font-bold text-text-muted">{t("common.memberCount", { count: "" })}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {t("winOverview.activeWinRate")}
                  </p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowInfo(!showInfo)}
                      onMouseEnter={() => setShowInfo(true)}
                      onMouseLeave={() => setShowInfo(false)}
                      className="text-zinc-400 transition-colors outline-none"
                    >
                      <DowinIcon name="status-info" size={12} />
                    </button>
                    {showInfo && (
                      <div className="absolute top-full right-0 mt-2 w-64 rounded-content border border-zinc-200 bg-white p-4 shadow-xl z-[60] animate-dowin-in">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-primary">
                          {t("winOverview.activeWinRate")}
                        </p>
                        <p className="text-[11px] leading-relaxed text-text-secondary whitespace-normal normal-case tracking-normal">
                          {t("trend.winRateDesc")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "font-mono text-4xl font-bold tracking-tight",
                    winRate >= 80 ? "text-primary" : winRate >= 50 ? "text-amber-500" : "text-zinc-400"
                  )}>
                    {winRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statusCards.map((card) => (
          <StatusBoardCard
            key={card.label}
            label={card.label}
            count={card.count}
            names={card.names}
            indicator={card.indicator}
          />
        ))}
      </div>
    </div>
  );
}



function StatusBoardCard({
  label,
  count,
  names,
  indicator,
}: {
  label: string;
  count: number;
  names: string[];
  indicator: string;
}) {
  const t = useTranslations("Report");
  const COLLAPSED_MAX = 3;
  const [expanded, setExpanded] = useState(false);
  const hasMore = names.length > COLLAPSED_MAX;
  const shownNames = expanded ? names : names.slice(0, COLLAPSED_MAX);

  return (
    <Card className="flex flex-col border border-zinc-200 bg-white">
      <div className="flex flex-col flex-1 p-4 sm:p-5 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", indicator)} />
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
              {label}
            </p>
          </div>
          <span className="font-mono text-2xl font-bold tracking-tighter text-text-primary">
            {count}
          </span>
        </div>

        <div className="flex-1">
          {shownNames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {shownNames.map((name) => (
                <span
                  key={`${label}-${name}`}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-bold text-text-secondary"
                >
                  {name}
                </span>
              ))}
              {hasMore && !expanded && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="rounded bg-zinc-50 px-1.5 py-0.5 text-[11px] font-bold text-text-muted"
                >
                  +{names.length - COLLAPSED_MAX}
                </button>
              )}
            </div>
          ) : (
            <p className="text-[11px] font-medium text-text-muted italic">
              {t("common.noMatchingMembers")}
            </p>
          )}
          {expanded && hasMore && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="mt-2 text-[11px] font-bold text-primary"
            >
              {t("common.collapse")}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function InlineEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border border-dashed border-border rounded-content p-8 bg-white text-center">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
    </Card>
  );
}

// ─── FocusMemberList ─────────────────────────────────────────────────────────

function FocusMemberList({ members }: { members: FocusMember[] }) {
  const t = useTranslations("Report");

  return (
    <Card className="overflow-hidden border border-zinc-200 bg-white">
      <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1.2fr)] gap-4 border-b border-zinc-100 bg-zinc-100 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted md:grid">
        <span>{t("focus.table.member")}</span>
        <span className="text-center">{t("focus.table.status")}</span>
        <span className="text-center">{t("focus.table.score")}</span>
        <span>{t("focus.table.nextAction")}</span>
      </div>

      <div className="divide-y divide-zinc-100">
        {members.map((member) => (
          <div
            key={member.key}
            className="grid gap-3 px-6 py-5 md:grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1.2fr)] md:items-center md:gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-text-primary">
                {member.name}
              </span>
            </div>

            <div className="flex md:justify-center">
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-bold tracking-tight md:text-[11px] border",
                  member.badgeTone
                )}
              >
                {member.status}
              </span>
            </div>

            <div className="flex md:justify-center">
              <span className="font-mono text-sm font-bold text-primary">
                {member.score}
              </span>
            </div>

            <div className="text-xs font-medium leading-relaxed text-text-secondary">
              {member.nextAction}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Other States ───────────────────────────────────────────────────────────

function ReportLoadingState() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <ProtectedPageContainer spacing="compact">
        <div className="h-16 w-48 animate-pulse rounded-content bg-sub-background" />
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <div className="hidden w-[240px] space-y-2 lg:block">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded-button bg-sub-background animate-pulse"
              />
            ))}
          </div>
          <div className="flex-1 space-y-10">
            <div className="h-64 rounded-content bg-sub-background animate-pulse" />
            <div className="h-48 rounded-content bg-sub-background animate-pulse" />
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function ReportNoWorkspaceState() {
  const t = useTranslations("Report");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[720px] p-4 md:p-8">
        <Card className="space-y-4 p-8 text-center rounded-content">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-content bg-primary/10">
            <DowinIcon name="nav-report" size="20px" className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {t("states.noWorkspaceTitle")}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("states.noWorkspaceDesc")}
          </p>
          <div className="flex justify-center">
            <NoWorkspaceActions />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportForbiddenState({ workspaceId }: { workspaceId: string }) {
  const t = useTranslations("Report");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[720px] p-4 md:p-8">
        <Card className="space-y-4 p-8 text-center rounded-content">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-content bg-primary/10">
            <DowinIcon name="nav-report" size="20px" className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {t("states.forbiddenTitle")}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("states.forbiddenDesc")}
          </p>
          <div className="flex justify-center">
            <Button asChild className="rounded-content">
              <Link href={`/${workspaceId}/dashboard`}>{t("states.backToDashboard")}</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportErrorState({ onRetry, workspaceId }: { onRetry: () => void, workspaceId: string }) {
  const t = useTranslations("Report");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[720px] p-4 md:p-8">
        <Card className="space-y-4 p-8 text-center rounded-content">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-content bg-primary/10">
            <DowinIcon name="nav-report" size="20px" className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {t("states.errorTitle")}
          </h1>
          <p className="text-sm text-text-secondary">{t("states.errorDesc")}</p>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={onRetry} className="rounded-content">
              {t("states.retry")}
            </Button>
            <Button
              asChild
              className="rounded-content border border-border bg-white px-4 py-2 text-sm font-bold text-text-primary transition-colors"
            >
              <Link href={`/${workspaceId}/dashboard`}>{t("states.backToDashboard")}</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
