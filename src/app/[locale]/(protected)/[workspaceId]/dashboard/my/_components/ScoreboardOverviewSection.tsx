import { useEffect, useState } from "react";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type WeeklyTrendPoint = {
  weekStart: string;
  label: string;
  rate: number;
};

interface ScoreboardOverviewSectionProps {
  activeScoreboard: ReturnType<typeof useDashboardScoreboard>["activeScoreboard"];
  isWeeklyTrendLoading: boolean;
  monthlyOverallRate: number;
  weeklyOverallRate: number;
  weeklyTrendPoints: WeeklyTrendPoint[];
}

export function ScoreboardOverviewSection({
  activeScoreboard,
  isWeeklyTrendLoading,
  monthlyOverallRate,
  weeklyOverallRate,
  weeklyTrendPoints,
}: ScoreboardOverviewSectionProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-3">
      {/* ── WIG & Lag Measure Hero Card (Vertical Stack Design) ── */}
      <div className="flex flex-col rounded-[24px] bg-white">
        <div className="flex flex-col">
          {/* Primary Goal (WIG) */}
          <div className="px-6 pt-5 pb-3 sm:px-8 sm:pt-6 sm:pb-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[#E8F3FF] text-primary text-[11px] font-bold tracking-tight uppercase">
                {t("dowinLabel")}
              </div>
            </div>
            {activeScoreboard ? (
              <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl break-words leading-[1.2]">
                {activeScoreboard.goalName}
              </h2>
            ) : (
              <div className="h-8 w-3/4 animate-pulse rounded-content bg-zinc-200" />
            )}
          </div>

          {/* Lag Measure Section */}
          <div className="px-6 pt-3 pb-5 sm:px-8 sm:pt-4 sm:pb-6 space-y-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-zinc-100 text-zinc-500 text-[11px] font-bold tracking-tight uppercase">
                {t("lagMeasureLabel")}
              </div>
            </div>
            {activeScoreboard ? (
              <p className="text-sm font-medium text-text-secondary leading-relaxed break-words">
                {activeScoreboard.lagMeasure}
              </p>
            ) : (
              <div className="h-5 w-1/2 animate-pulse rounded-content bg-zinc-200" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* ── Consolidated Achievement Card (Vertical Stack) ── */}
        <div className="flex flex-row divide-x divide-zinc-50 lg:flex-col lg:divide-x-0 lg:divide-y lg:divide-zinc-50 lg:col-span-1 rounded-[24px] bg-white">
          {/* Weekly Section */}
          <div className="flex flex-1 flex-col items-start p-4 gap-3">
            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              {t("weeklyAchievementRate")}
            </p>
            <div className="relative h-20 w-20 self-center">
              <AchievementDonut rate={weeklyOverallRate} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                <span className={cn("font-mono text-2xl font-bold leading-none", getRateColor(weeklyOverallRate))}>
                  {weeklyOverallRate}
                </span>
                <span className="text-[10px] font-bold text-text-muted">%</span>
              </div>
            </div>
          </div>

          {/* Monthly Section */}
          <div className="flex flex-1 flex-col items-start p-4 gap-3">
            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              {t("monthlyAchievementRate")}
            </p>
            <div className="relative h-20 w-20 self-center">
              <AchievementDonut rate={monthlyOverallRate} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                <span className={cn("font-mono text-2xl font-bold leading-none", getRateColor(monthlyOverallRate))}>
                  {monthlyOverallRate}
                </span>
                <span className="text-[10px] font-bold text-text-muted">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Trend (Expanded) ── */}
        <DashboardWeeklyTrendSection
          isLoading={isWeeklyTrendLoading}
          weeklyTrendPoints={weeklyTrendPoints}
          className="lg:col-span-4"
        />
      </div>
    </div>
  );
}

function AchievementDonut({ rate }: { rate: number }) {
  const data = [
    { name: "achieved", value: Math.min(rate, 100) },
    { name: "remaining", value: Math.max(0, 100 - rate) },
  ];

  const COLORS = {
    achieved: getRateColorHex(rate),
    remaining: "#f4f4f5", // Zinc-100
  };

  return (
    <PieChart width={80} height={80}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={28}
        outerRadius={32}
        paddingAngle={0}
        dataKey="value"
        startAngle={90}
        endAngle={-270}
        stroke="none"
      >
        <Cell fill={COLORS.achieved} />
        <Cell fill={COLORS.remaining} />
      </Pie>
    </PieChart>
  );
}

function getRateColor(v: number) {
  if (v >= 80) return "text-green-600";
  if (v >= 50) return "text-amber-600";
  return "text-primary";
}

function getRateColorHex(v: number) {
  if (v >= 80) return "#16a34a"; // Green-600
  if (v >= 50) return "#d97706"; // Amber-600
  return "#3a64c7"; // Primary
}

function DashboardWeeklyTrendSection({
  isLoading,
  weeklyTrendPoints,
  className,
}: {
  isLoading: boolean;
  weeklyTrendPoints: WeeklyTrendPoint[];
  className?: string;
}) {
  const t = useTranslations("Dashboard");

  return (
    <div className={cn("flex flex-col p-5 rounded-[24px] bg-white", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
          {t("recentTrend")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 animate-pulse rounded-lg bg-zinc-200" />
      ) : (
        <div className="h-[140px] lg:h-auto lg:flex-1 w-full min-h-[140px]">
          <WeeklyRateTrendChart points={weeklyTrendPoints} />
        </div>
      )}
    </div>
  );
}

function WeeklyRateTrendChart({ points }: { points: WeeklyTrendPoint[] }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const data = points.map((p) => ({
    name: p.label,
    rate: p.rate,
  }));

  if (!isMounted) return null;

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 10, height: 10 }}>
      <AreaChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
        <defs>
          <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={{ stroke: "rgba(0,0,0,0.05)", strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-[12px] bg-zinc-800 px-3 py-1.5 shadow-none">
                <p className="font-mono text-[11px] font-bold text-white">
                  {payload[0].value}%
                </p>
              </div>
            );
          }}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          dy={4}
        />
        <YAxis domain={[0, 100]} hide />
        <Area
          type="monotone"
          dataKey="rate"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#rateGrad)"
          dot={{ r: 2, fill: "var(--color-primary)", strokeWidth: 0 }}
          activeDot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }}
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
