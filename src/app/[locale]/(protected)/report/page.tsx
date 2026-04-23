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
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { BarChart3, CalendarDays, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
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
  const t = useTranslations("Report");
  const tDashboard = useTranslations("Dashboard");
  const { report, hasNoWorkspace, isError, isForbidden, isLoading, refetch } =
    useTeamWeeklyReport();
  const hasTrackedViewRef = useRef(false);

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
  if (isForbidden) return <ReportForbiddenState />;
  if (isError || !report) {
    return <ReportErrorState onRetry={() => void refetch()} />;
  }

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
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      <div className="mx-auto w-full max-w-[1200px] space-y-8 px-6 py-8 md:px-10 md:py-12 lg:px-12">

        <header className="px-1">
          <div className="min-w-0">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {tDashboard("weeklyReport")}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-mono rounded border border-slate-200 bg-slate-100/80 px-2 py-0.5 text-[11px] font-bold text-slate-600 tracking-tight">
                {weekLabel}
              </span>
            </div>
          </div>
        </header>

        <div className="space-y-2 px-1">
          <h2 className="text-lg font-bold tracking-tight text-text-primary md:text-xl">
            {hasActive
              ? t("header.activeTitle", {
                  activeCount: summary.activeCount,
                  winningCount: summary.winningCount,
                })
              : t("header.noActiveTitle")}
          </h2>
          <p className="text-sm leading-6 text-text-secondary">
            {summary.immediateCheckCount > 0
              ? t("header.needsCheckDesc", {
                  notStartedCount: summary.notStartedCount,
                  noScoreboardCount: summary.noScoreboardCount,
                })
              : t("header.allStartedDesc")}
          </p>
        </div>

        {hasMembers ? (
          <section className="space-y-3">
            <SectionLabel title={t("sections.teamStatus")} />
            <Card className="overflow-hidden rounded-content border border-border bg-white">
              {hasActive ? (
                <div className="px-5 py-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-text-primary">
                        {t("winRate.title")}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {t("winRate.desc")}
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
              ) : (
                <InlineEmptyState
                  title={t("empty.noActiveScoreboardsTitle")}
                  description={t("empty.noActiveScoreboardsDesc")}
                />
              )}
            </Card>
          </section>
        ) : (
          <InlineEmptyState
            title={t("empty.noMembersTitle")}
            description={t("empty.noMembersDesc")}
          />
        )}

        <TeamTrendChart
          trends={report.trends ?? []}
          workspaceId={report.workspaceId}
        />

        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2 px-1">
            <SectionLabel
              title={t("focus.title")}
              desc={t("focus.desc")}
              inline
            />
          </div>

          {summary.focusMembers.length > 0 ? (
            <FocusMemberList members={summary.focusMembers} />
          ) : (
            <div className="rounded-content border border-border bg-sub-background px-5 py-8 text-center">
              <p className="text-sm font-semibold text-text-primary">
                {t("focus.emptyTitle")}
              </p>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                {t("focus.emptyDesc")}
              </p>
            </div>
          )}
        </section>

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
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-content border border-border bg-white p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-primary">{label}</p>
            <p className="text-[11px] leading-relaxed text-text-secondary">{description}</p>
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
  const data = trends.map((trend, index) => ({
    week:
      index === trends.length - 1
        ? t("common.thisWeek")
        : formatShortWeekLabel(trend.weekStart, t),
    winRate: trend.winRate ?? 0,
    execRate: trend.executionRate ?? 0,
  }));
  const hasTrendData = data.length > 0;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-text-primary">
            {t("trend.title")}
          </h2>
          <p className="text-xs text-text-muted">{t("trend.desc")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <ChartLegendTooltip
            active={activeTooltip === "winRate"}
            label={t("trend.winRateLabel")}
            description={t("trend.winRateDesc")}
            color="#5e6ad2"
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
      </div>
      <Card className="overflow-hidden rounded-content border border-border bg-white px-2 py-5">
        {hasTrendData ? (
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
                    <div className="rounded-content border border-border bg-white px-3 py-2">
                      <p className="mb-1.5 text-[11px] font-bold text-text-primary">{label}</p>
                      {payload.map((entry) => (
                        <p key={entry.dataKey as string} className="text-[11px] text-text-muted">
                          <span
                            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.dataKey === "winRate"
                            ? t("trend.winRateLabel")
                            : t("trend.executionRateLabel")}
                          :{" "}
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
        ) : (
          <div className="flex min-h-[180px] flex-col items-center justify-center px-4 text-center">
            <p className="text-sm font-semibold text-text-primary">
              {t("empty.noTrendTitle")}
            </p>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              {t("empty.noTrendDesc")}
            </p>
          </div>
        )}
      </Card>
    </section>
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
  if (totalCount === 0) return null;

  const winRate = activeCount > 0 ? Math.round((winningCount / activeCount) * 100) : 0;
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
      caption: t("statusCards.winning.caption"),
      count: winningCount,
      names: winningNames,
      color: "bg-[#5e6ad2]",
      ring: "border-[rgba(94,106,210,0.2)]",
      surface: "bg-[rgba(94,106,210,0.04)]",
      valueTone: "text-[#5e6ad2]",
    },
    {
      label: t("statusCards.losing.label"),
      caption: t("statusCards.losing.caption"),
      count: losingCount,
      names: losingNames,
      color: "bg-amber-400",
      ring: "border-amber-200",
      surface: "bg-amber-50/50",
      valueTone: "text-amber-700",
    },
    {
      label: t("statusCards.notStarted.label"),
      caption: t("statusCards.notStarted.caption"),
      count: notStartedCount,
      names: notStartedNames,
      color: "bg-[rgba(156,163,175,1)]",
      ring: "border-[rgba(226,228,233,1)]",
      surface: "bg-sub-background",
      valueTone: "text-text-secondary",
    },
    {
      label: t("statusCards.noScoreboard.label"),
      caption: t("statusCards.noScoreboard.caption"),
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
      <div className="rounded-content border border-[rgba(94,106,210,0.15)] bg-[rgba(94,106,210,0.03)] px-4 py-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5e6ad2]">
            {t("winOverview.summaryLabel")}
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
                {t("winOverview.activeWinRate")}
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
                {t("winOverview.totalMembers")}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-lg font-bold tracking-tight text-text-primary">
                  {t("common.memberCount", { count: totalCount })}
                </span>
                <span className="text-xs text-text-muted">
                  {t("winOverview.thisWeekBasis")}
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
  const t = useTranslations("Report");
  const COLLAPSED_MAX = 4;
  const [expanded, setExpanded] = useState(false);
  const hasMore = names.length > COLLAPSED_MAX;
  const shownNames = expanded ? names : names.slice(0, COLLAPSED_MAX);

  return (
    <div className={`rounded-content border px-4 py-4 ${ring} ${surface}`}>
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
                  className="rounded-full border border-white/70 bg-white px-2.5 py-1 text-xs font-medium text-text-primary"
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
                {expanded
                  ? t("common.collapse")
                  : t("common.showMoreMembers", { count: names.length })}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-muted">{t("common.noMatchingMembers")}</p>
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

function InlineEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-content border border-border bg-sub-background px-5 py-8 text-center">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
    </div>
  );
}

// ─── FocusMemberList ─────────────────────────────────────────────────────────

function FocusMemberList({ members }: { members: FocusMember[] }) {
  const t = useTranslations("Report");

  return (
    <div className="overflow-hidden rounded-content border border-border bg-white">
      <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1.2fr)] gap-4 border-b border-border bg-sub-background px-5 py-3 text-[11px] font-semibold text-text-muted md:grid">
        <span>{t("focus.table.member")}</span>
        <span>{t("focus.table.status")}</span>
        <span>{t("focus.table.score")}</span>
        <span>{t("focus.table.nextAction")}</span>
      </div>

      <div className="divide-y divide-border">
        {members.map((member, idx) => (
          <div
            key={member.key}
            className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,1.2fr)] md:items-center md:gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-sub-background font-mono text-[11px] font-bold text-text-muted">
                {idx + 1}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-semibold tracking-tight text-text-primary">
                  {member.name}
                </p>
                <p className="text-xs text-text-muted md:hidden">
                  {t("focus.table.mobileScore", { score: member.score })}
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

// Page-local status components

function ReportLoadingState() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      <div className="mx-auto w-full max-w-[1200px] space-y-8 px-6 py-8 md:px-10 md:py-12 lg:px-12 animate-pulse">
        <div className="space-y-3 px-1">
          <div className="h-4 w-40 rounded bg-sub-background" />
          <div className="h-7 w-72 rounded bg-sub-background" />
          <div className="h-4 w-56 rounded bg-sub-background" />
        </div>
        <div className="h-48 rounded-content bg-sub-background" />
        <div className="h-40 rounded-content bg-sub-background" />
      </div>
    </div>
  );
}

function ReportNoWorkspaceState() {
  const t = useTranslations("Report");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] p-4 md:p-8">
        <Card className="space-y-4 p-8 text-center rounded-content">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-content bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
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

function ReportForbiddenState() {
  const t = useTranslations("Report");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] p-4 md:p-8">
        <Card className="space-y-4 p-8 text-center rounded-content">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-content bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {t("states.forbiddenTitle")}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("states.forbiddenDesc")}
          </p>
          <div className="flex justify-center">
            <Button asChild className="rounded-content">
              <Link href="/dashboard">{t("states.backToDashboard")}</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("Report");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px] p-4 md:p-8">
        <Card className="space-y-4 p-8 text-center rounded-content">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-content bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {t("states.errorTitle")}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("states.errorDesc")}
          </p>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={onRetry} className="rounded-content">{t("states.retry")}</Button>
            <Button
              asChild
              className="rounded-content border border-border bg-white px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:border-[rgba(205,207,213,1)]"
            >
              <Link href="/dashboard">{t("states.backToDashboard")}</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
