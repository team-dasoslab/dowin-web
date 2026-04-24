import { useDashboardScoreboard } from "@/app/[locale]/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { WigIcon } from "@/components/ui/WigIcon";
import { useTranslations } from "next-intl";

type WeeklyTrendPoint = {
  weekStart: string;
  label: string;
  rate: number;
};

interface ScoreboardOverviewSectionProps {
  activeScoreboard: NonNullable<
    ReturnType<typeof useDashboardScoreboard>["activeScoreboard"]
  >;
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
    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:items-stretch">
      <div className="space-y-3">
        <Card>
          <div className="flex flex-col gap-4 border-b border-zinc-200 px-4 py-4 sm:px-6">
            <div className="flex flex-row items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <WigIcon name="domain-flash" size="16px" className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {t("wigLabel")}
                </p>
                <h2 className="text-lg font-bold text-text-primary">
                  {activeScoreboard.goalName}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-zinc-50/50 px-4 py-3 sm:items-center sm:px-6">
            <WigIcon name="domain-target-arrow" size="14px" className="text-text-muted" />
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center">
              <span className="tracking-widest text-[10px] font-bold text-text-muted sm:mr-3">
                {t("lagMeasureLabel")}
              </span>
              <span className="break-words text-sm font-medium text-text-primary">
                {activeScoreboard.lagMeasure}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label={t("weeklyAchievementRate")}
              value={`${weeklyOverallRate}%`}
              valueClassName={
                weeklyOverallRate >= 80
                  ? "text-green-600"
                  : weeklyOverallRate >= 50
                    ? "text-amber-600"
                    : "text-text-primary"
              }
            />
            <StatCard
              label={
                monthLabel
                  ? t("monthlyAchievementRateWithMonth", { month: monthLabel })
                  : t("monthlyAchievementRate")
              }
              value={`${monthlyOverallRate}%`}
              valueClassName={
                monthlyOverallRate >= 80
                  ? "text-green-600"
                  : monthlyOverallRate >= 50
                    ? "text-amber-600"
                    : "text-text-primary"
              }
            />
          </div>
        </Card>
      </div>

      <DashboardWeeklyTrendSection
        isLoading={isWeeklyTrendLoading}
        isHistoryLimited={isTrendLimited}
        weeklyTrendPoints={weeklyTrendPoints}
      />
    </div>
  );
}


function DashboardWeeklyTrendSection({
  isLoading,
  isHistoryLimited,
  weeklyTrendPoints,
}: {
  isLoading: boolean;
  isHistoryLimited: boolean;
  weeklyTrendPoints: WeeklyTrendPoint[];
}) {
  const t = useTranslations("Dashboard");

  return (
    <Card className="flex h-full min-h-[220px] flex-col p-4">
      <p className="text-sm font-semibold text-text-primary">
        {t("recentTrend")}
      </p>
      {isLoading ? (
        <div className="mt-auto h-full min-h-[140px] animate-pulse rounded-md bg-sub-background" />
      ) : isHistoryLimited ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <div className="rounded-full bg-sub-background p-2">
            <WigIcon name="status-locked" size="16px" className="text-text-muted" />
          </div>
          <p className="text-[11px] text-text-muted">
            {t("historyLimitMessage")}
          </p>
        </div>
      ) : (
        <div className="mt-auto">
          <WeeklyRateTrendChart points={weeklyTrendPoints} />
        </div>
      )}
    </Card>
  );
}

function WeeklyRateTrendChart({ points }: { points: WeeklyTrendPoint[] }) {
  return (
    <div className="mt-3 flex h-full min-h-[140px] items-end gap-2 overflow-hidden pb-1">
      {points.map((point, index) => {
        const isCurrentWeek = index === points.length - 1;

        return (
          <div
            key={point.weekStart}
            className="flex h-full flex-1 flex-col items-center gap-1"
          >
            <div className="text-[10px] font-mono text-text-muted">
              {point.rate}%
            </div>
            <div className="flex h-full min-h-[72px] w-full items-end">
              <div
                className="w-full rounded-sm bg-primary/70"
                style={{ height: `${Math.max(point.rate, 4)}%` }}
              />
            </div>
            <div
              className={`text-[10px] font-mono ${
                isCurrentWeek ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {point.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
