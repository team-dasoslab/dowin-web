import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import {
  getRateBgColor,
  getRateColor,
} from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_utils/scoreboardOverviewSection";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
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
  activeScoreboard: ReturnType<
    typeof useDashboardScoreboard
  >["activeScoreboard"];
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
      {/* ── Goal Section ── */}
      <div className="flex flex-col rounded-[24px] bg-surface p-6 sm:p-8 space-y-7">
        <div className="space-y-2">
          <p className="text-[14px] font-bold text-text-muted">
            {t("dowinLabel")}
          </p>
          {activeScoreboard ? (
            <h2 className="text-[26px] font-black tracking-tight text-text-primary sm:text-[32px] break-words leading-tight">
              {activeScoreboard.goalName}
            </h2>
          ) : (
            <div className="h-9 w-3/4 animate-pulse rounded-[12px] bg-border" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[14px] font-bold text-text-muted">
            {t("lagMeasureLabel")}
          </p>
          {activeScoreboard ? (
            <p className="text-[17px] font-bold text-text-primary leading-snug break-words">
              {activeScoreboard.lagMeasure}
            </p>
          ) : (
            <div className="h-6 w-1/2 animate-pulse rounded-[12px] bg-border" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className="flex flex-row gap-3 lg:flex-col lg:gap-3 lg:col-span-1">
          {/* Weekly Section */}
          <div className="flex flex-1 flex-col justify-between p-5 rounded-[24px] bg-surface">
            <p className="text-[13px] font-bold text-text-muted">
              {t("weeklyAchievementRate")}
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-baseline gap-0.5">
                <span
                  className={cn(
                    "text-[32px] font-black tracking-tighter leading-none",
                    getRateColor(weeklyOverallRate),
                  )}
                >
                  {weeklyOverallRate}
                </span>
                <span className="text-[18px] font-bold text-text-muted leading-none">
                  %
                </span>
              </div>
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    getRateBgColor(weeklyOverallRate),
                  )}
                  style={{ width: `${Math.min(weeklyOverallRate, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Monthly Section */}
          <div className="flex flex-1 flex-col justify-between p-5 rounded-[24px] bg-surface">
            <p className="text-[13px] font-bold text-text-muted">
              {t("monthlyAchievementRate")}
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-baseline gap-0.5">
                <span
                  className={cn(
                    "text-[32px] font-black tracking-tighter leading-none",
                    getRateColor(monthlyOverallRate),
                  )}
                >
                  {monthlyOverallRate}
                </span>
                <span className="text-[18px] font-bold text-text-muted leading-none">
                  %
                </span>
              </div>
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    getRateBgColor(monthlyOverallRate),
                  )}
                  style={{ width: `${Math.min(monthlyOverallRate, 100)}%` }}
                />
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
    <div
      className={cn("flex flex-col p-5 rounded-[24px] bg-surface", className)}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[15px] font-bold text-text-primary">
          {t("recentTrend")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 animate-pulse rounded-lg bg-border" />
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
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={1}
      minHeight={1}
      initialDimension={{ width: 10, height: 10 }}
    >
      <AreaChart
        data={data}
        margin={{ top: 25, right: 10, left: 10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-primary)"
              stopOpacity={0.2}
            />
            <stop
              offset="95%"
              stopColor="var(--color-primary)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Tooltip
          cursor={{
            stroke: "rgba(0,0,0,0.05)",
            strokeWidth: 2,
            strokeDasharray: "4 4",
          }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-[12px] bg-zinc-800 px-3 py-1.5 shadow-xl">
                <p className="font-mono text-[12px] font-bold text-white">
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
          tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
          dy={8}
        />
        <YAxis domain={[0, 100]} hide />
        <Area
          type="monotone"
          dataKey="rate"
          stroke="var(--color-primary)"
          strokeWidth={3}
          fill="url(#rateGrad)"
          activeDot={{
            r: 6,
            fill: "var(--color-primary)",
            stroke: "#fff",
            strokeWidth: 3,
          }}
          dot={(props: { cx?: number; cy?: number; index?: number }) => {
            const { cx, cy, index } = props;
            if (index === data.length - 1) {
              return (
                <circle
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="var(--color-primary)"
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }
            return <svg key={`dot-${index}`} />;
          }}
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
