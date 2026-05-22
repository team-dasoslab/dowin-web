import { LeadMeasureSummary } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/LeadMeasureSummary";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import { AchievementProgress } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/AchievementProgress";
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
  tagsByMeasureId: Map<
    number | null,
    Array<{ id?: number | null; name?: string | null }>
  >;
  today: string;
  weekDatesInMonth: ReturnType<typeof getMonthCalendarWeeks>[number];
  weekIndex: number;
  localizedDays: string[];
};

export function MonthlyMobileCards(props: MonthlyMobileCardsProps) {
  const {
    activeLeadMeasures,
    monthLabel,
    monthWeeks,
    monthlyLeadMeasures,
    today,
  } = props;
  const t = useTranslations("Dashboard");
  const tagsByMeasureId = new Map(
    activeLeadMeasures.map((leadMeasure) => [
      leadMeasure.id ?? null,
      leadMeasure.tags ?? [],
    ]),
  );
  const localizedDays = [
    t("mon"),
    t("tue"),
    t("wed"),
    t("thu"),
    t("fri"),
    t("sat"),
    t("sun"),
  ];

  return (
    <div className="space-y-3 md:hidden">
      {monthWeeks.map((weekDatesInMonth, weekIndex) => (
        <MonthlyMobileWeekCard
          key={`${monthLabel}-mobile-week-${weekIndex + 1}`}
          monthLabel={monthLabel}
          monthlyLeadMeasures={monthlyLeadMeasures}
          tagsByMeasureId={tagsByMeasureId}
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
  today,
  weekDatesInMonth,
  weekIndex,
  localizedDays,
}: MonthlyMobileWeekCardProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="rounded-content border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <p className="text-sm font-bold text-text-primary">
          {t("weekNumber", { n: weekIndex + 1 })}
        </p>
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

    return leadMeasure.logs?.[date] === true ? count + 1 : count;
  }, 0);

  return (
    <div className="rounded-content border border-border bg-sub-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <LeadMeasureSummary name={leadMeasure.name} tags={tags} />
        <AchievementProgress
          achievedCount={visibleAchievedCount}
          periodLabel={
            leadMeasure.period === "WEEKLY"
              ? t("weeklyLabel")
              : t("monthlyLabel")
          }
          targetValue={targetValue}
          trackBackgroundClassName="bg-white"
          valueTextSizeClassName="text-xs"
        />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {weekDatesInMonth.map((date, dayIndex) => (
          <MonthlyMobileMeasureDay
            key={`${leadMeasure.id}-${localizedDays[dayIndex]}-${date ?? "empty"}-mobile`}
            date={date}
            dayLabel={localizedDays[dayIndex]}
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
          <DowinIcon name="action-checkmark" size="14px" />
        ) : date ? (
          date.slice(8, 10)
        ) : (
          "."
        )}
      </span>
    </div>
  );
}
