import { useDashboardScoreboard } from "@/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { AchievementProgress } from "@/app/(protected)/dashboard/_components/AchievementProgress";
import {
  DAY_LABELS,
  getMonthCalendarWeeks,
} from "@/app/(protected)/dashboard/my/_lib/week";
import { Check } from "lucide-react";

type MonthlyLeadMeasure = NonNullable<
  ReturnType<typeof useDashboardScoreboard>["monthlyLeadMeasures"]
>[number];

type MonthlyMobileCardsProps = {
  monthWeeks: ReturnType<typeof getMonthCalendarWeeks>;
  monthLabel?: string;
  monthlyLeadMeasures: MonthlyLeadMeasure[];
  today: string;
};

type MonthlyMobileWeekCardProps = {
  monthLabel?: string;
  monthlyLeadMeasures: MonthlyLeadMeasure[];
  today: string;
  weekDatesInMonth: ReturnType<typeof getMonthCalendarWeeks>[number];
  weekIndex: number;
};

export function MonthlyMobileCards(props: MonthlyMobileCardsProps) {
  const { monthLabel, monthWeeks, monthlyLeadMeasures, today } = props;

  return (
    <div className="space-y-3 md:hidden">
      {monthWeeks.map((weekDatesInMonth, weekIndex) => (
        <MonthlyMobileWeekCard
          key={`${monthLabel}-mobile-week-${weekIndex + 1}`}
          monthLabel={monthLabel}
          monthlyLeadMeasures={monthlyLeadMeasures}
          today={today}
          weekDatesInMonth={weekDatesInMonth}
          weekIndex={weekIndex}
        />
      ))}
    </div>
  );
}

function MonthlyMobileWeekCard({
  monthLabel,
  monthlyLeadMeasures,
  today,
  weekDatesInMonth,
  weekIndex,
}: MonthlyMobileWeekCardProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <p className="text-sm font-bold text-text-primary">{weekIndex + 1}주차</p>
        <p className="text-[11px] font-mono text-text-muted">
          {weekDatesInMonth.find(Boolean)?.slice(5).replace("-", ".")}
          {" – "}
          {weekDatesInMonth
            .filter((date): date is string => date !== null)
            .at(-1)
            ?.slice(5)
            .replace("-", ".")}
        </p>
      </div>

      <div className="mt-3 space-y-3">
        {monthlyLeadMeasures.map((leadMeasure) => (
          <MonthlyMobileMeasureCard
            key={`${monthLabel}-${weekIndex}-${leadMeasure.id}-mobile`}
            leadMeasure={leadMeasure}
            today={today}
            weekDatesInMonth={weekDatesInMonth}
          />
        ))}
      </div>
    </div>
  );
}

type MonthlyMobileMeasureCardProps = {
  leadMeasure: MonthlyLeadMeasure;
  today: string;
  weekDatesInMonth: ReturnType<typeof getMonthCalendarWeeks>[number];
};

function MonthlyMobileMeasureCard({
  leadMeasure,
  today,
  weekDatesInMonth,
}: MonthlyMobileMeasureCardProps) {
  const targetValue = leadMeasure.targetValue ?? 0;
  const visibleAchievedCount = weekDatesInMonth.reduce((count, date) => {
    if (!date) {
      return count;
    }

    return leadMeasure.logs?.[date] === true ? count + 1 : count;
  }, 0);

  return (
    <div className="rounded-lg border border-border bg-sub-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {leadMeasure.name}
          </p>
          <p className="text-[11px] text-text-muted">
            목표 {targetValue}회 / {leadMeasure.period === "WEEKLY" ? "주" : "월"}
          </p>
        </div>
        <AchievementProgress
          achievedCount={visibleAchievedCount}
          targetValue={targetValue}
          trackBackgroundClassName="bg-white"
          valueTextSizeClassName="text-xs"
        />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {weekDatesInMonth.map((date, dayIndex) => (
          <MonthlyMobileMeasureDay
            key={`${leadMeasure.id}-${DAY_LABELS[dayIndex]}-${date ?? "empty"}-mobile`}
            date={date}
            dayLabel={DAY_LABELS[dayIndex]}
            today={today}
            value={date ? (leadMeasure.logs?.[date] ?? null) : null}
          />
        ))}
      </div>
    </div>
  );
}

type MonthlyMobileMeasureDayProps = {
  date: string | null;
  dayLabel: string;
  today: string;
  value: boolean | null;
};

function MonthlyMobileMeasureDay({
  date,
  dayLabel,
  today,
  value,
}: MonthlyMobileMeasureDayProps) {
  const isToday = date === today;

  return (
    <div className="space-y-1 text-center">
      <p
        className={`text-[10px] font-bold ${
          isToday ? "text-primary" : "text-text-muted"
        }`}
      >
        {dayLabel}
      </p>
      <span
        className={`inline-flex h-9 w-full items-center justify-center rounded-md border text-xs font-bold ${
          value === true
            ? "border-primary bg-primary text-white"
            : date === null
              ? "border-transparent bg-transparent text-transparent"
              : isToday
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border bg-white text-text-muted"
        }`}
      >
        {value === true ? (
          <Check className="h-3.5 w-3.5" />
        ) : date ? (
          date.slice(8, 10)
        ) : (
          "."
        )}
      </span>
    </div>
  );
}
