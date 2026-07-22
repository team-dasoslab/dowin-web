import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import {
  getRateBgColor,
  getRateColor,
} from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_utils/scoreboardOverviewSection";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { WeeklyRateTrendChart } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/WeeklyRateTrendChart";

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

