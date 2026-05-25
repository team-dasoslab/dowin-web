"use client";

import { type WeeklyLogGuide } from "@/api/generated/dowin.schemas";
import { LeadMeasureSummary } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/LeadMeasureSummary";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import { isEditableDailyLogDate } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { AchievementProgress } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/AchievementProgress";
import { Button } from "@/components/ui/Button";
import { toNumberId } from "@/lib/client/frontend-api";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useState } from "react";
import { useTranslations } from "next-intl";

type WeeklyMobileCardsProps = {
  activeLeadMeasures: ReturnType<typeof useDashboardScoreboard>["activeLeadMeasures"];
  onBeforeToggle: () => void;
  pendingLogKeys: ReturnType<typeof useDashboardScoreboard>["pendingLogKeys"];
  today: string;
  toggleLog: ReturnType<typeof useDashboardScoreboard>["toggleLog"];
  weekDates: string[];
  weeklyGuideById: Map<number | null, WeeklyLogGuide | null>;
  weeklyById: ReturnType<typeof useDashboardScoreboard>["weeklyById"];
};

type WeeklyMobileCardProps = {
  leadMeasure: WeeklyMobileCardsProps["activeLeadMeasures"][number];
  onBeforeToggle: WeeklyMobileCardsProps["onBeforeToggle"];
  pendingLogKeys: WeeklyMobileCardsProps["pendingLogKeys"];
  today: string;
  toggleLog: WeeklyMobileCardsProps["toggleLog"];
  weekDates: string[];
  weeklyGuideById: WeeklyMobileCardsProps["weeklyGuideById"];
  weeklyById: WeeklyMobileCardsProps["weeklyById"];
};

export function WeeklyMobileCards(props: WeeklyMobileCardsProps) {
  const { activeLeadMeasures } = props;
  const t = useTranslations("Dashboard");
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
      {activeLeadMeasures.map((leadMeasure) => (
        <WeeklyMobileCard
          key={`weekly-mobile-${leadMeasure.id}`}
          {...props}
          leadMeasure={leadMeasure}
          localizedDays={localizedDays}
        />
      ))}
    </div>
  );
}

function WeeklyMobileCard({
  leadMeasure,
  onBeforeToggle,
  pendingLogKeys,
  today,
  toggleLog,
  weekDates,
  weeklyGuideById,
  weeklyById,
  localizedDays,
}: WeeklyMobileCardProps & { localizedDays: string[] }) {
  const t = useTranslations("Dashboard");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const leadMeasureId = toNumberId(leadMeasure.id);
  const weekly = weeklyById.get(leadMeasureId);
  const achievedCount = weekly?.achieved ?? 0;
  const targetValue = leadMeasure.targetValue ?? 0;
  const guide = weeklyGuideById.get(leadMeasureId);

  return (
    <div className="rounded-content border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <LeadMeasureSummary
            guide={guide}
            guideActive={isGuideOpen}
            name={leadMeasure.name}
            onGuideClose={() => setIsGuideOpen(false)}
            onGuideToggle={() => setIsGuideOpen((open) => !open)}
            tags={leadMeasure.tags ?? []}
          />
        </div>
        <AchievementProgress
          achievedCount={achievedCount}
          periodLabel={
            leadMeasure.period === "MONTHLY"
              ? t("monthlyLabel")
              : t("weeklyLabel")
          }
          targetValue={targetValue}
        />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {weekDates.map((date, index) => (
          <WeeklyMobileCardDay
            key={`${leadMeasure.id}-${date}`}
            date={date}
            dayLabel={localizedDays[index]}
            leadMeasureId={leadMeasureId}
            onBeforeToggle={onBeforeToggle}
            pendingLogKeys={pendingLogKeys}
            today={today}
            toggleLog={toggleLog}
            value={
              weekly?.logs?.[date] === undefined ? null : weekly.logs[date]
            }
          />
        ))}
      </div>
    </div>
  );
}

type WeeklyMobileCardDayProps = {
  date: string;
  dayLabel: string;
  leadMeasureId: number | null;
  onBeforeToggle: WeeklyMobileCardsProps["onBeforeToggle"];
  pendingLogKeys: WeeklyMobileCardsProps["pendingLogKeys"];
  today: string;
  toggleLog: WeeklyMobileCardsProps["toggleLog"];
  value: boolean | null;
};

function WeeklyMobileCardDay({
  date,
  dayLabel,
  leadMeasureId,
  onBeforeToggle,
  pendingLogKeys,
  today,
  toggleLog,
  value,
}: WeeklyMobileCardDayProps) {
  const isToday = date === today;
  const isEditable = isEditableDailyLogDate(date, today);
  const currentLogKey = leadMeasureId === null ? null : `${leadMeasureId}:${date}`;
  const isPending = currentLogKey !== null && pendingLogKeys.has(currentLogKey);

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
        disabled={isPending || !isEditable || leadMeasureId === null}
        onClick={() => {
          if (leadMeasureId !== null && isEditable) {
            onBeforeToggle();
            void toggleLog(leadMeasureId, date);
          }
        }}
        className={`flex aspect-square w-full items-center justify-center rounded-md border p-0 text-sm transition-colors ${
          value === true
            ? "border-primary bg-primary text-white"
            : isToday
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border bg-sub-background text-text-muted"
        } ${
          isPending || !isEditable
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }`}
      >
        {value === true ? (
          <DowinIcon name="action-checkmark" size="14px" className="mx-auto" />
        ) : (
          <span className="text-[10px] font-mono">{date.slice(8, 10)}</span>
        )}
      </Button>
    </div>
  );
}
