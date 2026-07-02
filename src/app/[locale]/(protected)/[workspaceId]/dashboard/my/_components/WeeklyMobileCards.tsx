"use client";

import { type WeeklyLogGuide } from "@/api/generated/dowin.schemas";
import { AchievementProgress } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/AchievementProgress";
import { LeadMeasureSummary } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/LeadMeasureSummary";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import { isEditableDailyLogDate } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { toNumberId } from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
type WeeklyMobileCardsProps = {
  activeLeadMeasures: ReturnType<
    typeof useDashboardScoreboard
  >["activeLeadMeasures"];
  onBeforeToggle: () => void;
  pendingLogKeys: ReturnType<typeof useDashboardScoreboard>["pendingLogKeys"];
  today: string;
  toggleLog: ReturnType<typeof useDashboardScoreboard>["toggleLog"];
  weekDates: string[];
  weeklyGuideById: Map<number | null, WeeklyLogGuide | null>;
  weeklyById: ReturnType<typeof useDashboardScoreboard>["weeklyById"];
  allowPastDailyLogEdit?: boolean;
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
  allowPastDailyLogEdit?: boolean;
};

export function WeeklyMobileCards(props: WeeklyMobileCardsProps) {
  const { activeLeadMeasures, weeklyById, allowPastDailyLogEdit = false } = props;
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
          allowPastDailyLogEdit={allowPastDailyLogEdit}
          weeklyById={weeklyById}
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
  allowPastDailyLogEdit,
}: WeeklyMobileCardProps & {
  localizedDays: string[];
}) {
  const t = useTranslations("Dashboard");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const leadMeasureId = toNumberId(leadMeasure.id);
  const weekly = weeklyById.get(leadMeasureId);
  const achievedCount = weekly?.achieved ?? 0;
  const targetValue = leadMeasure.targetValue ?? 0;
  const guide = weeklyGuideById.get(leadMeasureId);

  return (
    <div className="rounded-[24px] bg-surface p-5">
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
            leadMeasureName={leadMeasure.name}
            onBeforeToggle={onBeforeToggle}
            pendingLogKeys={pendingLogKeys}
            today={today}
            toggleLog={toggleLog}
            allowPastDailyLogEdit={allowPastDailyLogEdit}
            trackingMode={
              (leadMeasure as { trackingMode?: string }).trackingMode
            }
            dailyTargetCount={
              (leadMeasure as { dailyTargetCount?: number }).dailyTargetCount ??
              1
            }
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
  leadMeasureName: string | null | undefined;
  onBeforeToggle: WeeklyMobileCardsProps["onBeforeToggle"];
  pendingLogKeys: WeeklyMobileCardsProps["pendingLogKeys"];
  today: string;
  toggleLog: WeeklyMobileCardsProps["toggleLog"];
  allowPastDailyLogEdit?: boolean;
  trackingMode?: string;
  dailyTargetCount?: number;
  value: import("@/api/generated/dowin.schemas").DailyLogCell | null;
};

function WeeklyMobileCardDay({
  date,
  dayLabel,
  leadMeasureId,
  leadMeasureName,
  onBeforeToggle,
  pendingLogKeys,
  today,
  toggleLog,
  allowPastDailyLogEdit,
  trackingMode,
  dailyTargetCount = 1,
  value,
}: WeeklyMobileCardDayProps) {
  const isToday = date === today;
  const isEditable = isEditableDailyLogDate(date, today, allowPastDailyLogEdit);
  const currentLogKey =
    leadMeasureId === null ? null : `${leadMeasureId}:${date}`;
  const isPending = currentLogKey !== null && pendingLogKeys.has(currentLogKey);
  const isCount = trackingMode === "COUNT";
  const t = useTranslations("Dashboard");
  const measureName = leadMeasureName ?? t("leadMeasureHead");

  const count = value?.count ?? null;
  const isAchieved = value?.achieved ?? false;

  const [openPopover, setOpenPopover] = useState(false);
  const [localCount, setLocalCount] = useState(count || 0);

  const handleCountSave = (newCount: number) => {
    if (leadMeasureId !== null) {
      toggleLog(leadMeasureId, date, newCount);
    }
  };

  return (
    <div className="text-center relative">
      <p
        className={`mb-1.5 text-[11px] font-bold ${
          isToday ? "text-primary" : "text-text-muted"
        }`}
      >
        {dayLabel}
      </p>
      {isCount ? (
        <>
          <Button
            aria-label={t("editDailyCount", {
              date,
              measureName,
            })}
            disabled={isPending || !isEditable || leadMeasureId === null}
            onClick={() => {
              if (leadMeasureId !== null && isEditable) {
                setOpenPopover(!openPopover);
              }
            }}
            variant={
              isAchieved
                ? "primary"
                : (count ?? 0) > 0
                  ? "primary-subtle"
                  : isToday
                    ? "primary-ghost"
                    : "secondary"
            }
            className="flex aspect-square w-full items-center justify-center !rounded-[12px] p-0"
          >
            <span className="text-[12px] font-bold tracking-tighter leading-none">
              {(count ?? 0) > 0 ? `${count}/${dailyTargetCount}` : ""}
            </span>
          </Button>

          <Dialog open={openPopover} onOpenChange={setOpenPopover}>
            <DialogContent 
              className="bg-surface rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-6 w-[320px] animate-in zoom-in-95 fade-in duration-200"
              overlayClassName="bg-black/20"
              hideCloseButton
            >
              <Button
                aria-label={t("closeDailyCount")}
                variant="subtle"
                size="icon"
                className="absolute top-3 right-3 rounded-full bg-transparent hover:bg-sub-background"
                onClick={() => setOpenPopover(false)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-text-muted"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
              <h3 className="text-lg font-bold text-center text-text-primary mb-1 pr-6 pl-6">
                {t("dailyCountTitle")}
              </h3>
              <p className="text-sm text-center text-text-muted mb-8">
                {date} ({dayLabel})
              </p>

              <div className="flex flex-col items-center gap-8">
                <div className="flex items-end justify-center gap-2 w-full">
                  <input
                    type="number"
                    min="0"
                    value={localCount}
                    onChange={(e) =>
                      setLocalCount(parseInt(e.target.value, 10) || 0)
                    }
                    className="w-32 text-5xl font-black text-primary text-center bg-sub-background rounded-[16px] border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all py-3"
                    placeholder="0"
                  />
                  <span className="text-2xl text-text-muted/40 font-bold mb-2">
                    / {dailyTargetCount}
                  </span>
                </div>

                <div className="flex w-full gap-2 mt-3">
                  <Button
                    variant="subtle"
                    size="lg"
                    className="flex-1 text-[24px]"
                    onClick={() =>
                      setLocalCount(Math.max(0, localCount - 1))
                    }
                  >
                    -
                  </Button>
                  <Button
                    variant="subtle"
                    size="lg"
                    className="flex-1 text-[24px]"
                    onClick={() => setLocalCount(localCount + 1)}
                  >
                    +
                  </Button>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  aria-label={t("saveDailyCount")}
                  className="w-full mt-4"
                  onClick={() => {
                    handleCountSave(localCount);
                    setOpenPopover(false);
                  }}
                >
                  확인
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Button
          aria-label={t("toggleDailyLog", {
            date,
            measureName,
          })}
          disabled={isPending || !isEditable || leadMeasureId === null}
          onClick={() => {
            if (leadMeasureId !== null && isEditable) {
              onBeforeToggle();
              void toggleLog(leadMeasureId, date);
            }
          }}
          variant={
            isAchieved
              ? "primary"
              : isToday
                ? "primary-ghost"
                : "secondary"
          }
          className="flex aspect-square w-full items-center justify-center !rounded-[12px] p-0"
        >
          {isAchieved ? (
            <DowinIcon
              name="action-checkmark"
              size="14px"
              className="mx-auto"
            />
          ) : null}
        </Button>
      )}
    </div>
  );
}
