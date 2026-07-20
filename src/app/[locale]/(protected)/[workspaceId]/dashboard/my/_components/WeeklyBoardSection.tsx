"use client";

import { type WeeklyLogGuide } from "@/api/generated/dowin.schemas";
import { LeadMeasureSummary } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/LeadMeasureSummary";
import { DailyPrLinksPopover } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/DailyPrLinksPopover";
import { WeeklyMobileCards } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/WeeklyMobileCards";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import { isEditableDailyLogDate } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { toNumberId } from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface WeeklyBoardSectionProps {
  activeLeadMeasures: ReturnType<typeof useDashboardScoreboard>["activeLeadMeasures"];
  onBeforeToggle: () => void;
  pendingLogKeys: ReturnType<typeof useDashboardScoreboard>["pendingLogKeys"];
  today: string;
  toggleLog: ReturnType<typeof useDashboardScoreboard>["toggleLog"];
  weekDates: string[];
  weeklyGuideById: Map<number | null, WeeklyLogGuide | null>;
  weeklyById: ReturnType<typeof useDashboardScoreboard>["weeklyById"];
  allowPastDailyLogEdit?: boolean;
}

import { Dialog, DialogContent } from "@/components/ui/Dialog";

function CountPopoverContent({
  initialCount,
  dailyTargetCount,
  onSave,
  onClose,
  closeLabel,
  saveLabel,
  title,
  subtitle,
}: {
  initialCount: number;
  dailyTargetCount: number;
  onSave: (count: number) => void;
  onClose: () => void;
  closeLabel: string;
  saveLabel: string;
  title: string;
  subtitle: string;
}) {
  const [localCount, setLocalCount] = useState(initialCount);

  // Sync state if initialCount changes while open
  useEffect(() => {
    setLocalCount(initialCount);
  }, [initialCount]);

  return (
    <DialogContent
      className="bg-surface rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-6 w-[320px] animate-in zoom-in-95 fade-in duration-200"
      overlayClassName="bg-black/20"
    >
      <Button
        aria-label={closeLabel}
        className="absolute top-3 right-3 p-2 min-h-0 rounded-full bg-transparent hover:bg-sub-background"
        onClick={onClose}
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
      <h3 className="text-lg font-bold text-center text-text-primary mb-1 pr-6 pl-6">{title}</h3>
      <p className="text-sm text-center text-text-muted mb-8">{subtitle}</p>

      <div className="flex flex-col items-center gap-8">
        <div className="flex items-end justify-center gap-2 w-full">
          <input
            type="number"
            min="0"
            value={localCount}
            onChange={(e) => setLocalCount(parseInt(e.target.value, 10) || 0)}
            className="w-32 text-5xl font-black text-primary text-center bg-sub-background rounded-[16px] border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all py-3"
            placeholder="0"
          />
          <span className="text-2xl text-text-muted/40 font-bold mb-2">/ {dailyTargetCount}</span>
        </div>

        <div className="flex w-full gap-2 mt-3">
          <Button
            variant="subtle"
            size="lg"
            className="flex-1 text-[24px]"
            onClick={() => setLocalCount(Math.max(0, localCount - 1))}
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
          aria-label={saveLabel}
          className="w-full mt-4"
          onClick={() => {
            onSave(localCount);
            onClose();
          }}
        >
          확인
        </Button>
      </div>
    </DialogContent>
  );
}

export function WeeklyBoardSection({
  activeLeadMeasures,
  onBeforeToggle,
  pendingLogKeys,
  today,
  toggleLog,
  weekDates,
  weeklyGuideById,
  weeklyById,
  allowPastDailyLogEdit = false,
}: WeeklyBoardSectionProps) {
  const t = useTranslations("Dashboard");
  const [activeGuideId, setActiveGuideId] = useState<number | null>(null);
  const [openPopoverKey, setOpenPopoverKey] = useState<string | null>(null);

  const localizedDays = [t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")];

  return (
    <>
      <WeeklyMobileCards
        activeLeadMeasures={activeLeadMeasures}
        onBeforeToggle={onBeforeToggle}
        pendingLogKeys={pendingLogKeys}
        today={today}
        toggleLog={toggleLog}
        weekDates={weekDates}
        weeklyGuideById={weeklyGuideById}
        weeklyById={weeklyById}
      />

      <div className="relative hidden overflow-hidden rounded-[24px] bg-surface md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="border-b border-border bg-surface">
              <table className="w-full table-fixed text-xs">
                <colgroup>
                  <col className="w-[38%]" />
                  {localizedDays.map((day) => (
                    <col key={day} className="w-[8%]" />
                  ))}
                  <col className="w-[14%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-text-muted">
                      {t("leadMeasureHead")}
                    </th>
                    {localizedDays.map((day, index) => (
                      <th
                        key={day}
                        className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest ${
                          weekDates[index] === today ? "text-primary" : "text-text-muted"
                        }`}
                      >
                        {day}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-muted">
                      {t("achievement")}
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            <table className="w-full table-fixed text-xs">
              <colgroup>
                <col className="w-[38%]" />
                {localizedDays.map((day) => (
                  <col key={day} className="w-[8%]" />
                ))}
                <col className="w-[14%]" />
              </colgroup>
              <tbody className="divide-y divide-border">
                {activeLeadMeasures.map((leadMeasure) => {
                  const leadMeasureId = toNumberId(leadMeasure.id);
                  const weekly = weeklyById.get(leadMeasureId);
                  const guide = weeklyGuideById.get(leadMeasureId);
                  const achievedCount = weekly?.achieved ?? 0;
                  const targetValue = leadMeasure.targetValue ?? 0;
                  const weeklyTotal = weekly?.total ?? targetValue;
                  const rate =
                    weeklyTotal > 0 ? Math.round((achievedCount / weeklyTotal) * 100) : 0;

                  return (
                    <tr key={leadMeasure.id} className="bg-surface">
                      <td className="px-5 py-4">
                        <LeadMeasureSummary
                          guide={guide}
                          guideActive={activeGuideId === leadMeasureId}
                          name={leadMeasure.name}
                          achieved={weekly?.achieved}
                          lastWeekAchieved={weekly?.lastWeekAchieved}
                          nameClassName="block text-sm font-semibold text-text-primary"
                          onGuideClose={() => setActiveGuideId(null)}
                          onGuideToggle={() =>
                            setActiveGuideId((currentId) =>
                              currentId === leadMeasureId ? null : leadMeasureId,
                            )
                          }
                          tags={leadMeasure.tags ?? []}
                          publicId={weekly?.publicId}
                        />
                      </td>

                      {weekDates.map((date) => {
                        const currentValueObj:
                          | import("@/api/generated/dowin.schemas").DailyLogCell
                          | null = weekly?.logs?.[date] === undefined ? null : weekly.logs[date];
                        const currentValue = currentValueObj?.value ?? null;
                        const count = currentValueObj?.count ?? 0;
                        const isAchievedDaily = currentValueObj?.achieved ?? false;
                        const typedLead = leadMeasure as {
                          trackingMode?: string;
                          dailyTargetCount?: number;
                        };
                        const trackingMode = typedLead.trackingMode;
                        const dailyTargetCount = typedLead.dailyTargetCount ?? 1;
                        const isCount = trackingMode === "COUNT";

                        const isToday = date === today;
                        const isEditable = isEditableDailyLogDate(
                          date,
                          today,
                          allowPastDailyLogEdit,
                        );
                        const currentLogKey =
                          leadMeasureId === null ? null : `${leadMeasureId}:${date}`;
                        const isPending =
                          currentLogKey !== null && pendingLogKeys.has(currentLogKey);
                        const measureName = leadMeasure.name ?? t("leadMeasureHead");
                        const prLinksForDate = weekly?.githubPrLinks?.filter((pr) => pr.dailyLogDate === date) ?? [];

                        return (
                          <td key={date} className="py-4 text-center relative">
                            <div className="flex h-full flex-col items-center justify-start gap-1.5">
                              {/* PR row — fixed height matches LeadMeasureSummary top row */}
                              <div className="flex h-[24px] w-full items-center justify-center">
                                <DailyPrLinksPopover prLinks={prLinksForDate} />
                              </div>
                              {/* Button row — fixed height matches LeadMeasureSummary bottom row */}
                              <div className="flex h-[36px] w-full items-center justify-center">
                                {isCount ? (
                                  <>
                                    <Button
                                      aria-label={t("editDailyCount", {
                                        date,
                                        measureName,
                                      })}
                                      disabled={isPending || !isEditable || leadMeasureId === null}
                                      onClick={() => {
                                        if (leadMeasureId !== null && isEditable && !isPending) {
                                          setOpenPopoverKey(
                                            openPopoverKey === `${leadMeasure.id}-${date}`
                                              ? null
                                              : `${leadMeasure.id}-${date}`,
                                          );
                                        }
                                      }}
                                      variant={
                                        isAchievedDaily
                                          ? "primary"
                                          : count > 0
                                            ? "primary-subtle"
                                            : date === today
                                              ? "primary-ghost"
                                              : "secondary"
                                      }
                                      className={`mx-auto flex aspect-square h-9 w-9 items-center justify-center !rounded-[12px] p-0 transition-all ${
                                        isPending || !isEditable
                                          ? "cursor-not-allowed opacity-50"
                                          : "cursor-pointer"
                                      }`}
                                    >
                                      <span className="text-[10px] font-bold tracking-tighter leading-none">
                                        {count > 0 ? `${count}/${dailyTargetCount}` : ""}
                                      </span>
                                    </Button>
                                    <Dialog
                                      open={openPopoverKey === `${leadMeasure.id}-${date}`}
                                      onOpenChange={(open) => {
                                        if (!open) setOpenPopoverKey(null);
                                      }}
                                    >
                                      <CountPopoverContent
                                        initialCount={count}
                                        dailyTargetCount={dailyTargetCount}
                                        closeLabel={t("closeDailyCount")}
                                        saveLabel={t("saveDailyCount")}
                                        title={leadMeasure.name ?? t("dailyCountTitle")}
                                        subtitle={date}
                                        onClose={() => setOpenPopoverKey(null)}
                                        onSave={(newCount) =>
                                          toggleLog(leadMeasureId ?? 0, date, newCount)
                                        }
                                      />
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
                                      currentValue === true
                                        ? "primary"
                                        : isToday
                                          ? "primary-ghost"
                                          : "secondary"
                                    }
                                    className={`mx-auto flex aspect-square h-9 w-9 items-center justify-center !rounded-[12px] p-0 transition-all ${
                                      isPending || !isEditable
                                        ? "cursor-not-allowed opacity-50"
                                        : "cursor-pointer"
                                    }`}
                                  >
                                    {currentValue === true ? (
                                      <DowinIcon
                                        name="action-checkmark"
                                        size="14px"
                                        className="shrink-0"
                                      />
                                    ) : null}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[11px] font-medium text-text-muted">
                            {leadMeasure.period === "MONTHLY"
                              ? t("monthlyLabel")
                              : t("weeklyLabel")}
                          </span>
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-border">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                rate >= 100 ? "bg-green-500" : "bg-primary"
                              }`}
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono text-[11px] font-black ${
                              rate >= 100 ? "text-green-600" : "text-text-muted"
                            }`}
                          >
                            {achievedCount}/{weeklyTotal}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
