"use client";

import { type WeeklyLogGuide } from "@/api/generated/dowin.schemas";
import { LeadMeasureSummary } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/LeadMeasureSummary";
import { WeeklyMobileCards } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/WeeklyMobileCards";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import { isEditableDailyLogDate } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-scoreboard";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { toNumberId } from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface WeeklyBoardSectionProps {
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
}

function CountPopoverContent({
  initialCount,
  dailyTargetCount,
  onSave,
  onClose,
  title,
  subtitle,
}: {
  initialCount: number;
  dailyTargetCount: number;
  onSave: (count: number) => void;
  onClose: () => void;
  title: string;
  subtitle: string;
}) {
  const [localCount, setLocalCount] = useState(initialCount);

  // Sync state if initialCount changes while open
  useEffect(() => {
    setLocalCount(initialCount);
  }, [initialCount]);

  return (
    <div
      className="fixed z-[10000] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-[320px] animate-in zoom-in-95 fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <button className="absolute top-3 right-3 p-2" onClick={onClose}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-400"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
      <h3 className="text-lg font-bold text-center text-text-primary mb-1 pr-6 pl-6">
        {title}
      </h3>
      <p className="text-sm text-center text-text-muted mb-8">{subtitle}</p>

      <div className="flex flex-col items-center gap-8">
        <div className="flex items-end justify-center gap-2 w-full">
          <input
            type="number"
            min="0"
            value={localCount}
            onChange={(e) => setLocalCount(parseInt(e.target.value, 10) || 0)}
            className="w-32 text-6xl font-black text-primary text-center bg-zinc-50 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/50 transition-all py-2"
            placeholder="0"
          />
          <span className="text-2xl text-text-muted/40 font-bold mb-2">
            / {dailyTargetCount}
          </span>
        </div>

        <div className="flex w-full gap-3 mt-2">
          <Button
            className="flex-1 h-14 text-2xl font-bold bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
            onClick={() => setLocalCount(Math.max(0, localCount - 1))}
          >
            -
          </Button>
          <Button
            className="flex-1 h-14 text-2xl font-bold bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
            onClick={() => setLocalCount(localCount + 1)}
          >
            +
          </Button>
        </div>

        <Button
          className="w-full h-12 mt-2 text-base font-bold"
          onClick={() => {
            onSave(localCount);
            onClose();
          }}
        >
          확인
        </Button>
      </div>
    </div>
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
}: WeeklyBoardSectionProps) {
  const t = useTranslations("Dashboard");
  const [activeGuideId, setActiveGuideId] = useState<number | null>(null);
  const [openPopoverKey, setOpenPopoverKey] = useState<string | null>(null);

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

      <div className="relative hidden overflow-hidden rounded-content border border-border md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="border-b border-border bg-sub-background">
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
                          weekDates[index] === today
                            ? "text-primary"
                            : "text-text-muted"
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
                    weeklyTotal > 0
                      ? Math.round((achievedCount / weeklyTotal) * 100)
                      : 0;

                  return (
                    <tr key={leadMeasure.id} className="bg-white">
                      <td className="px-5 py-4">
                        <LeadMeasureSummary
                          guide={guide}
                          guideActive={activeGuideId === leadMeasureId}
                          name={leadMeasure.name}
                          nameClassName="block text-sm font-semibold text-text-primary"
                          onGuideClose={() => setActiveGuideId(null)}
                          onGuideToggle={() =>
                            setActiveGuideId((currentId) =>
                              currentId === leadMeasureId
                                ? null
                                : leadMeasureId,
                            )
                          }
                          tags={leadMeasure.tags ?? []}
                        />
                      </td>

                      {weekDates.map((date) => {
                        const currentValueObj: import("@/api/generated/dowin.schemas").DailyLogCell | null =
                          weekly?.logs?.[date] === undefined
                            ? null
                            : weekly.logs[date];
                        const currentValue = currentValueObj?.value ?? null;
                        const count = currentValueObj?.count ?? 0;
                        const isAchievedDaily = currentValueObj?.achieved ?? false;
                        const typedLead = leadMeasure as { trackingMode?: string; dailyTargetCount?: number };
                        const trackingMode = typedLead.trackingMode;
                        const dailyTargetCount = typedLead.dailyTargetCount ?? 1;
                        const isCount = trackingMode === "COUNT";

                        const isToday = date === today;
                        const isEditable = isEditableDailyLogDate(date, today);
                        const currentLogKey =
                          leadMeasureId === null
                            ? null
                            : `${leadMeasureId}:${date}`;
                        const isPending =
                          currentLogKey !== null &&
                          pendingLogKeys.has(currentLogKey);

                        return (
                          <td key={date} className="py-3 text-center">
                            {isCount ? (
                              <div className="flex flex-col items-center justify-center relative">
                                <Button
                                  disabled={!isEditable}
                                  onClick={() =>
                                    setOpenPopoverKey(
                                      openPopoverKey ===
                                        `${leadMeasure.id}-${date}`
                                        ? null
                                        : `${leadMeasure.id}-${date}`,
                                    )
                                  }
                                  className={`mx-auto flex aspect-square h-9 w-9 items-center justify-center rounded-md border p-0 transition-colors ${
                                    isAchievedDaily
                                      ? "border-primary bg-primary text-white"
                                      : count > 0
                                        ? "border-primary/30 bg-primary/10 text-primary"
                                        : date === today
                                          ? "border-primary/30 bg-primary/5 text-primary"
                                          : "border-border bg-sub-background text-text-muted hover:bg-zinc-50"
                                  } ${
                                    !isEditable
                                      ? "cursor-not-allowed opacity-50"
                                      : "cursor-pointer"
                                  }`}
                                >
                                  <span className="text-[10px] font-bold tracking-tighter leading-none">
                                    {count > 0
                                      ? `${count}/${dailyTargetCount}`
                                      : ""}
                                  </span>
                                </Button>

                                {openPopoverKey ===
                                  `${leadMeasure.id}-${date}` &&
                                  typeof document !== "undefined" &&
                                  createPortal(
                                    <>
                                      <div
                                        className="fixed inset-0 z-[9999] bg-black/20 animate-in fade-in"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenPopoverKey(null);
                                        }}
                                      />
                                      <CountPopoverContent
                                        initialCount={count}
                                        dailyTargetCount={dailyTargetCount}
                                        title={
                                          leadMeasure.name ??
                                          t("dailyCountTitle")
                                        }
                                        subtitle={date}
                                        onClose={() => setOpenPopoverKey(null)}
                                        onSave={(newCount) =>
                                          toggleLog(
                                            leadMeasureId ?? 0,
                                            date,
                                            newCount,
                                          )
                                        }
                                      />
                                    </>,
                                    document.body,
                                  )}
                              </div>
                            ) : (
                              <Button
                                disabled={
                                  isPending ||
                                  !isEditable ||
                                  leadMeasureId === null
                                }
                                onClick={() => {
                                  if (leadMeasureId !== null && isEditable) {
                                    onBeforeToggle();
                                    void toggleLog(leadMeasureId, date);
                                  }
                                }}
                                className={`mx-auto flex aspect-square h-9 w-9 items-center justify-center rounded-md border p-0 transition-colors ${
                                  currentValue === true
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
                                {currentValue === true ? (
                                  <DowinIcon
                                    name="action-checkmark"
                                    size="14px"
                                    className="shrink-0"
                                  />
                                ) : null}
                              </Button>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[10px] text-text-muted">
                            {leadMeasure.period === "MONTHLY"
                              ? t("monthlyLabel")
                              : t("weeklyLabel")}
                          </span>
                          <div className="h-1 w-10 overflow-hidden rounded-full border border-border bg-sub-background">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                rate >= 100 ? "bg-green-500" : "bg-primary"
                              }`}
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono text-[10px] font-bold ${
                              rate >= 100
                                ? "text-green-600"
                                : "text-text-secondary"
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
