import { useDashboardScoreboard } from "@/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { DAY_LABELS } from "@/app/(protected)/dashboard/my/_lib/week";
import { AchievementProgress } from "@/app/(protected)/dashboard/_components/AchievementProgress";
import { Button } from "@/components/ui/Button";
import { toNumberId } from "@/lib/client/frontend-api";
import { Check } from "lucide-react";

type WeeklyMobileCardsProps = {
  activeLeadMeasures: ReturnType<typeof useDashboardScoreboard>["activeLeadMeasures"];
  isLogPending: boolean;
  pendingLogKey: string | null;
  today: string;
  toggleLog: ReturnType<typeof useDashboardScoreboard>["toggleLog"];
  weekDates: string[];
  weeklyById: ReturnType<typeof useDashboardScoreboard>["weeklyById"];
};

type WeeklyMobileCardProps = {
  isLogPending: boolean;
  leadMeasure: WeeklyMobileCardsProps["activeLeadMeasures"][number];
  pendingLogKey: string | null;
  today: string;
  toggleLog: WeeklyMobileCardsProps["toggleLog"];
  weekDates: string[];
  weeklyById: WeeklyMobileCardsProps["weeklyById"];
};

export function WeeklyMobileCards(props: WeeklyMobileCardsProps) {
  const { activeLeadMeasures } = props;

  return (
    <div className="space-y-3 md:hidden">
      {activeLeadMeasures.map((leadMeasure) => (
        <WeeklyMobileCard
          key={`weekly-mobile-${leadMeasure.id}`}
          {...props}
          leadMeasure={leadMeasure}
        />
      ))}
    </div>
  );
}

function WeeklyMobileCard({
  isLogPending,
  leadMeasure,
  pendingLogKey,
  today,
  toggleLog,
  weekDates,
  weeklyById,
}: WeeklyMobileCardProps) {
  const leadMeasureId = toNumberId(leadMeasure.id);
  const weekly = weeklyById.get(leadMeasureId);
  const achievedCount = weekly?.achieved ?? 0;
  const targetValue = leadMeasure.targetValue ?? 0;

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {leadMeasure.name}
          </p>
          <p className="text-[11px] text-text-muted">
            목표 {targetValue}회 /{" "}
            {leadMeasure.period === "DAILY"
              ? "일"
              : leadMeasure.period === "WEEKLY"
                ? "주"
                : "월"}
          </p>
        </div>
        <AchievementProgress
          achievedCount={achievedCount}
          targetValue={targetValue}
        />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {weekDates.map((date, index) => (
          <WeeklyMobileCardDay
            key={`${leadMeasure.id}-${date}`}
            date={date}
            dayLabel={DAY_LABELS[index]}
            isLogPending={isLogPending}
            leadMeasureId={leadMeasureId}
            pendingLogKey={pendingLogKey}
            today={today}
            toggleLog={toggleLog}
            value={weekly?.logs?.[date] === undefined ? null : weekly.logs[date]}
          />
        ))}
      </div>
    </div>
  );
}

type WeeklyMobileCardDayProps = {
  date: string;
  dayLabel: string;
  isLogPending: boolean;
  leadMeasureId: number | null;
  pendingLogKey: string | null;
  today: string;
  toggleLog: WeeklyMobileCardsProps["toggleLog"];
  value: boolean | null;
};

function WeeklyMobileCardDay({
  date,
  dayLabel,
  isLogPending,
  leadMeasureId,
  pendingLogKey,
  today,
  toggleLog,
  value,
}: WeeklyMobileCardDayProps) {
  const isToday = date === today;
  const currentLogKey = leadMeasureId === null ? null : `${leadMeasureId}:${date}`;
  const isPending = pendingLogKey === currentLogKey;

  return (
    <div className="space-y-1 text-center">
      <p
        className={`text-[10px] font-bold ${
          isToday ? "text-primary" : "text-text-muted"
        }`}
      >
        {dayLabel}
      </p>
      <Button
        disabled={isPending || isLogPending || leadMeasureId === null}
        onClick={() => {
          if (leadMeasureId !== null) {
            void toggleLog(leadMeasureId, date);
          }
        }}
        className={`h-9 w-full rounded-md border text-sm transition-colors ${
          value === true
            ? "border-primary bg-primary text-white"
            : isToday
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border bg-sub-background text-text-muted"
        } ${
          isPending || isLogPending
            ? "cursor-not-allowed opacity-70"
            : "cursor-pointer"
        }`}
      >
        {value === true ? (
          <Check className="mx-auto h-3.5 w-3.5" />
        ) : (
          <span className="text-[10px] font-mono">{date.slice(8, 10)}</span>
        )}
      </Button>
    </div>
  );
}
