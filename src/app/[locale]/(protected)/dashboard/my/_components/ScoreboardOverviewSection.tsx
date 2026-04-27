import { useDashboardScoreboard } from "@/app/[locale]/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { Card } from "@/components/ui/Card";
import { DowinIcon, type IconName } from "@/components/ui/DowinIcon";
import { PeriodBadge } from "@/components/ui/PeriodBadge";
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
  isTrendLimited: boolean;
  monthLabel?: string;
  monthlyOverallRate: number;
  weeklyOverallRate: number;
  weeklyTrendPoints: WeeklyTrendPoint[];
}

export function ScoreboardOverviewSection({
  activeScoreboard,
  isWeeklyTrendLoading,
  isTrendLimited,
  monthLabel,
  monthlyOverallRate,
  weeklyOverallRate,
  weeklyTrendPoints,
}: ScoreboardOverviewSectionProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="flex flex-col gap-3">
      {/* ── WIG & Lag Measure Hero Card (Vertical Stack Design) ── */}
      <Card className="border border-zinc-200 bg-white">
        <div className="flex flex-col">
          {/* Primary Goal (WIG) */}
          <div className="px-6 pt-5 pb-3 sm:px-8 sm:pt-6 sm:pb-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 bg-primary rounded-full" />
              <p className="text-[11px] font-bold tracking-widest text-primary uppercase">
                {t("dowinLabel")}
              </p>
            </div>
            {activeScoreboard ? (
              <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl break-words leading-[1.2]">
                {activeScoreboard.goalName}
              </h2>
            ) : (
              <div className="h-8 w-3/4 animate-pulse rounded-content bg-zinc-100" />
            )}
          </div>

          {/* Lag Measure Section */}
          <div className="px-6 pt-3 pb-5 sm:px-8 sm:pt-4 sm:pb-6 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 bg-zinc-200 rounded-full" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
                {t("lagMeasureLabel")}
              </p>
            </div>
            {activeScoreboard ? (
              <p className="text-sm font-medium text-text-secondary leading-relaxed break-words">
                {activeScoreboard.lagMeasure}
              </p>
            ) : (
              <div className="h-5 w-1/2 animate-pulse rounded-content bg-zinc-50" />
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* ── Consolidated Achievement Card (Vertical Stack) ── */}
        <Card className="flex flex-col lg:col-span-1">
          {/* Weekly Section */}
          <div className="flex flex-col items-start p-4 gap-4">
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

          <div className="h-px w-full bg-zinc-100" />

          {/* Monthly Section */}
          <div className="flex flex-col items-start p-4 gap-4">
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
        </Card>

        {/* ── Recent Trend (Expanded) ── */}
        <DashboardWeeklyTrendSection
          isLoading={isWeeklyTrendLoading}
          isHistoryLimited={isTrendLimited}
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
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
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
    </ResponsiveContainer>
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

function getProgressColor(v: number) {
  if (v >= 80) return "bg-green-500";
  if (v >= 50) return "bg-amber-500";
  return "bg-primary";
}

function DashboardWeeklyTrendSection({
  isLoading,
  isHistoryLimited,
  weeklyTrendPoints,
  className,
}: {
  isLoading: boolean;
  isHistoryLimited: boolean;
  weeklyTrendPoints: WeeklyTrendPoint[];
  className?: string;
}) {
  const t = useTranslations("Dashboard");

  return (
    <Card className={cn("flex flex-col p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
          {t("recentTrend")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 animate-pulse rounded-lg bg-zinc-50" />
      ) : isHistoryLimited ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-1">
          <p className="text-[10px] text-text-muted text-center leading-tight">
            {t("historyLimitMessage")}
          </p>
        </div>
      ) : (
        <div className="flex-1">
          <WeeklyRateTrendChart points={weeklyTrendPoints} />
        </div>
      )}
    </Card>
  );
}

function WeeklyRateTrendChart({ points }: { points: WeeklyTrendPoint[] }) {
  const data = points.map((p) => ({
    name: p.label,
    rate: p.rate,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
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
              <div className="rounded-md border border-zinc-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
                <p className="font-mono text-[10px] font-bold text-primary">
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
          dy={6}
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
