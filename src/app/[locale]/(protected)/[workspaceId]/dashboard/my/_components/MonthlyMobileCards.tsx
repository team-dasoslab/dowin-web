import { AchievementProgress } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/AchievementProgress";
import { DailyPrLinksPopover } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/DailyPrLinksPopover";
import { LeadMeasureSummary } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/LeadMeasureSummary";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import { getMonthCalendarWeeks } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";

type MonthlyLeadMeasure = NonNullable<
  ReturnType<typeof useDashboardScoreboard>["monthlyLeadMeasures"]
>[number];

type MonthlyMobileCardsProps = {
  activeLeadMeasures: ReturnType<typeof useDashboardScoreboard>["activeLeadMeasures"];
  monthWeeks: ReturnType<typeof getMonthCalendarWeeks>;
  monthLabel?: string;
  monthlyLeadMeasures: MonthlyLeadMeasure[];
  today: string;
};

type MonthlyMobileWeekCardProps = {
  monthLabel?: string;
  monthlyLeadMeasures: MonthlyLeadMeasure[];
  tagsByMeasureId: Map<number | null, Array<{ id?: number | null; name?: string | null }>>;
  createdAtById: Map<number | null, Date | string | null>;
  today: string;
  weekDatesInMonth: ReturnType<typeof getMonthCalendarWeeks>[number];
  weekIndex: number;
  localizedDays: string[];
};

export function MonthlyMobileCards(props: MonthlyMobileCardsProps) {
  const { activeLeadMeasures, monthLabel, monthWeeks, monthlyLeadMeasures, today } = props;
  const t = useTranslations("Dashboard");
  const tagsByMeasureId = new Map(
    activeLeadMeasures.map((leadMeasure) => [leadMeasure.id ?? null, leadMeasure.tags ?? []]),
  );
  const createdAtById = new Map(
    activeLeadMeasures.map((leadMeasure) => [
      leadMeasure.id ?? null,
      leadMeasure.createdAt ?? null,
    ]),
  );
  const localizedDays = [t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")];

  return (
    <div className="space-y-3 md:hidden">
      {monthWeeks.map((weekDatesInMonth, weekIndex) => (
        <MonthlyMobileWeekCard
          key={`${monthLabel}-mobile-week-${weekIndex + 1}`}
          monthLabel={monthLabel}
          monthlyLeadMeasures={monthlyLeadMeasures}
          tagsByMeasureId={tagsByMeasureId}
          createdAtById={createdAtById}
          today={today}
          weekDatesInMonth={weekDatesInMonth}
          weekIndex={weekIndex}
          localizedDays={localizedDays}
        />
      ))}
    </div>
  );
}

function MonthlyMobileWeekCard({
  monthLabel,
  monthlyLeadMeasures,
  tagsByMeasureId,
  createdAtById,
  today,
  weekDatesInMonth,
  weekIndex,
  localizedDays,
}: MonthlyMobileWeekCardProps) {
  const t = useTranslations("Dashboard");

  const weekFilteredMeasures = monthlyLeadMeasures.filter((leadMeasure) => {
    const createdAt = createdAtById.get(leadMeasure.id ?? null);
    if (!createdAt) return true;

    const weekEnd = weekDatesInMonth.filter((d): d is string => d !== null).at(-1);
    if (!weekEnd) return true;

    const d = new Date(createdAt);
    if (isNaN(d.getTime())) {
      return (createdAt as string).split("T")[0] <= weekEnd;
    }
    const kstMs = d.getTime() + 9 * 60 * 60 * 1000;
    const kstDate = new Date(kstMs);
    const createdAtDate = `${kstDate.getUTCFullYear()}-${String(kstDate.getUTCMonth() + 1).padStart(2, "0")}-${String(kstDate.getUTCDate()).padStart(2, "0")}`;

    return createdAtDate <= weekEnd;
  });

  if (weekFilteredMeasures.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-1 pt-2">
          <p className="text-[14px] font-black text-text-primary">
            {t("weekNumber", { n: weekIndex + 1 })}
          </p>
          <p className="text-[12px] font-mono font-medium text-text-muted">
            {weekDatesInMonth.find(Boolean)?.slice(5).replace("-", ".")}
            {" – "}
            {weekDatesInMonth
              .filter((date): date is string => date !== null)
              .at(-1)
              ?.slice(5)
              .replace("-", ".")}
          </p>
        </div>
        <div className="rounded-[24px] bg-surface p-8 text-center text-[13px] font-medium text-text-muted">
          {t("noActiveMeasures")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1 pt-2">
        <p className="text-[14px] font-black text-text-primary">
          {t("weekNumber", { n: weekIndex + 1 })}
        </p>
        <p className="text-[12px] font-mono font-medium text-text-muted">
          {weekDatesInMonth.find(Boolean)?.slice(5).replace("-", ".")}
          {" – "}
          {weekDatesInMonth
            .filter((date): date is string => date !== null)
            .at(-1)
            ?.slice(5)
            .replace("-", ".")}
        </p>
      </div>

      <div className="space-y-3">
        {weekFilteredMeasures.map((leadMeasure) => (
          <MonthlyMobileMeasureCard
            key={`${monthLabel}-${weekIndex}-${leadMeasure.id}-mobile`}
            leadMeasure={leadMeasure}
            tags={tagsByMeasureId.get(leadMeasure.id ?? null) ?? []}
            today={today}
            weekDatesInMonth={weekDatesInMonth}
            localizedDays={localizedDays}
          />
        ))}
      </div>
    </div>
  );
}

type MonthlyMobileMeasureCardProps = {
  leadMeasure: MonthlyLeadMeasure;
  tags: Array<{ id?: number | null; name?: string | null }>;
  today: string;
  weekDatesInMonth: ReturnType<typeof getMonthCalendarWeeks>[number];
  localizedDays: string[];
};

function MonthlyMobileMeasureCard({
  leadMeasure,
  tags,
  today,
  weekDatesInMonth,
  localizedDays,
}: MonthlyMobileMeasureCardProps) {
  const t = useTranslations("Dashboard");
  const targetValue = leadMeasure.targetValue ?? 0;
  const visibleAchievedCount = weekDatesInMonth.reduce((count, date) => {
    if (!date) {
      return count;
    }

    return leadMeasure.logs?.[date]?.achieved ? count + 1 : count;
  }, 0);

  return (
    <div className="rounded-[24px] bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <LeadMeasureSummary
            name={leadMeasure.name}
            tags={tags}
            publicId={leadMeasure.publicId}
          />
        </div>
        <AchievementProgress
          achievedCount={visibleAchievedCount}
          periodLabel={leadMeasure.period === "WEEKLY" ? t("weeklyLabel") : t("monthlyLabel")}
          targetValue={targetValue}
        />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {weekDatesInMonth.map((date, dayIndex) => (
          <MonthlyMobileMeasureDay
            key={`${leadMeasure.id}-${localizedDays[dayIndex]}-${date ?? "empty"}-mobile`}
            date={date}
            dayLabel={localizedDays[dayIndex]}
            today={today}
            trackingMode={(leadMeasure as { trackingMode?: string }).trackingMode}
            dailyTargetCount={(leadMeasure as { dailyTargetCount?: number }).dailyTargetCount ?? 1}
            value={date ? (leadMeasure.logs?.[date] ?? null) : null}
            prLinks={date ? (leadMeasure.githubPrLinks?.filter((pr) => pr.dailyLogDate === date) ?? []) : []}
          />
        ))}
      </div>
    </div>
  );
}

import type { DailyLogCell, GithubPrLink } from "@/api/generated/dowin.schemas";

type MonthlyMobileMeasureDayProps = {
  date: string | null;
  dayLabel: string;
  today: string;
  trackingMode?: string;
  dailyTargetCount?: number;
  value: DailyLogCell | null;
  prLinks?: GithubPrLink[];
};

function MonthlyMobileMeasureDay({
  date,
  dayLabel,
  today,
  trackingMode,
  dailyTargetCount = 1,
  value,
  prLinks = [],
}: MonthlyMobileMeasureDayProps) {
  const isToday = date === today;
  const isCount = trackingMode === "COUNT";
  const count = value?.count ?? 0;

  return (
    <div className="space-y-1 text-center relative">
      <p className={`text-[11px] font-bold ${isToday ? "text-primary" : "text-text-muted"}`}>
        {dayLabel}
      </p>
      {isCount ? (
        <span
          className={`mx-auto flex aspect-square w-full items-center justify-center !rounded-[12px] p-0 transition-all ${
            value?.achieved
              ? "bg-primary text-white"
              : count > 0
                ? "bg-primary/15 text-primary"
                : date === null
                  ? "bg-transparent text-transparent"
                  : isToday
                    ? "bg-primary/5 text-primary"
                    : "bg-sub-background text-text-muted"
          }`}
        >
          <span className="text-[12px] font-bold tracking-tighter leading-none">
            {count > 0 ? `${count}/${dailyTargetCount}` : ""}
          </span>
        </span>
      ) : (
        <span
          className={`mx-auto flex aspect-square w-full items-center justify-center !rounded-[12px] p-0 transition-colors ${
            value?.achieved
              ? "bg-primary text-white"
              : date === null
                ? "bg-transparent text-transparent"
                : isToday
                  ? "bg-primary/5 text-primary"
                  : "bg-sub-background text-text-muted"
          }`}
        >
          {value?.achieved ? <DowinIcon name="action-checkmark" size="14px" /> : null}
        </span>
      )}
      {date && <DailyPrLinksPopover prLinks={prLinks} />}
    </div>
  );
}
