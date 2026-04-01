import { useDashboardScoreboard } from "@/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { Card } from "@/components/ui/Card";
import { Target, Zap } from "lucide-react";

type WeeklyTrendPoint = {
  weekStart: string;
  label: string;
  rate: number;
};

interface ScoreboardOverviewSectionProps {
  activeScoreboard: NonNullable<ReturnType<typeof useDashboardScoreboard>["activeScoreboard"]>;
  isWeeklyTrendLoading: boolean;
  monthLabel?: string;
  monthlyOverallRate: number;
  weeklyOverallRate: number;
  weeklyTrendPoints: WeeklyTrendPoint[];
}

export function ScoreboardOverviewSection({
  activeScoreboard,
  isWeeklyTrendLoading,
  monthLabel,
  monthlyOverallRate,
  weeklyOverallRate,
  weeklyTrendPoints,
}: ScoreboardOverviewSectionProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:items-stretch">
      <div className="space-y-3">
        <Card className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6">
            <div className="flex flex-row items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  가중목
                </p>
                <h2 className="text-lg font-bold text-text-primary">
                  {activeScoreboard.goalName}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-sub-background px-4 py-3 sm:items-center sm:px-6">
            <Target className="h-3.5 w-3.5 text-text-muted" />
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center">
              <span className="tracking-widest text-[10px] font-bold text-text-muted sm:mr-3">
                후행지표
              </span>
              <span className="break-words text-sm font-medium text-text-primary">
                {activeScoreboard.lagMeasure}
              </span>
            </div>
          </div>
        </Card>

        <Card className="rounded-lg border border-border bg-white p-4">
          <div className="grid grid-cols-2 gap-2">
            <DashboardRateCard label="이번 주 달성률" rate={weeklyOverallRate} />
            <DashboardRateCard
              label={`이번 달 달성률${monthLabel ? ` (${monthLabel})` : ""}`}
              rate={monthlyOverallRate}
            />
          </div>
        </Card>
      </div>

      <DashboardWeeklyTrendSection
        isLoading={isWeeklyTrendLoading}
        weeklyTrendPoints={weeklyTrendPoints}
      />
    </div>
  );
}

function DashboardRateCard({
  label,
  rate,
}: {
  label: string;
  rate: number;
}) {
  return (
    <div className="rounded-md border border-border bg-sub-background px-3 py-2">
      <p className="text-[10px] text-text-muted">{label}</p>
      <p
        className={`font-mono text-lg font-bold ${
          rate >= 80
            ? "text-green-600"
            : rate >= 50
              ? "text-amber-600"
              : "text-text-primary"
        }`}
      >
        {rate}%
      </p>
    </div>
  );
}

function DashboardWeeklyTrendSection({
  isLoading,
  weeklyTrendPoints,
}: {
  isLoading: boolean;
  weeklyTrendPoints: WeeklyTrendPoint[];
}) {
  return (
    <Card className="flex h-full min-h-[220px] flex-col overflow-hidden rounded-lg border border-border bg-white p-4">
      <p className="text-sm font-semibold text-text-primary">최근 4주 달성률</p>
      {isLoading ? (
        <div className="mt-auto h-full min-h-[140px] animate-pulse rounded-md bg-sub-background" />
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
