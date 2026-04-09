"use client";

import { type WeeklyLogGuide } from "@/api/generated/wig.schemas";
import { useDashboardScoreboard } from "@/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { LeadMeasureGuideTooltip } from "@/app/(protected)/dashboard/my/_components/LeadMeasureGuideTooltip";
import { WeeklyMobileCards } from "@/app/(protected)/dashboard/my/_components/WeeklyMobileCards";
import { isEditableDailyLogDate } from "@/app/(protected)/dashboard/my/_lib/dashboard-scoreboard";
import { DAY_LABELS } from "@/app/(protected)/dashboard/my/_lib/week";
import { Button } from "@/components/ui/Button";
import { toNumberId } from "@/lib/client/frontend-api";
import { Check } from "lucide-react";
import { useState } from "react";

interface WeeklyBoardSectionProps {
  activeLeadMeasures: ReturnType<typeof useDashboardScoreboard>["activeLeadMeasures"];
  onBeforeToggle: () => void;
  pendingLogKeys: ReturnType<typeof useDashboardScoreboard>["pendingLogKeys"];
  today: string;
  toggleLog: ReturnType<typeof useDashboardScoreboard>["toggleLog"];
  weekDates: string[];
  weeklyGuideById: Map<number | null, WeeklyLogGuide | null>;
  weeklyById: ReturnType<typeof useDashboardScoreboard>["weeklyById"];
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
  const [activeGuideId, setActiveGuideId] = useState<number | null>(null);

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

      <div className="relative hidden overflow-hidden rounded-lg border border-border md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="border-b border-border bg-sub-background">
              <table className="w-full table-fixed text-xs">
                <colgroup>
                  <col className="w-[38%]" />
                  {DAY_LABELS.map((day) => (
                    <col key={day} className="w-[8%]" />
                  ))}
                  <col className="w-[14%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-text-muted">
                      선행지표
                    </th>
                    {DAY_LABELS.map((day, index) => (
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
                      달성
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            <table className="w-full table-fixed text-xs">
              <colgroup>
                <col className="w-[38%]" />
                {DAY_LABELS.map((day) => (
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
                  const rate =
                    targetValue > 0
                      ? Math.round((achievedCount / targetValue) * 100)
                      : 0;

                  return (
                    <tr key={leadMeasure.id} className="bg-white">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <p className="block min-w-0 truncate text-sm font-semibold text-text-primary">
                            {leadMeasure.name}
                          </p>
                          {guide && leadMeasureId !== null ? (
                            <LeadMeasureGuideTooltip
                              active={activeGuideId === leadMeasureId}
                              guide={guide}
                              onClose={() => setActiveGuideId(null)}
                              onToggle={() =>
                                setActiveGuideId((currentId) =>
                                  currentId === leadMeasureId ? null : leadMeasureId,
                                )
                              }
                            />
                          ) : null}
                        </div>
                        <span className="text-[10px] text-text-muted">
                          목표 {targetValue}회 /{" "}
                          {leadMeasure.period === "DAILY"
                            ? "일"
                            : leadMeasure.period === "WEEKLY"
                              ? "주"
                              : "월"}
                        </span>
                      </td>

                      {weekDates.map((date) => {
                        const currentValue =
                          weekly?.logs?.[date] === undefined
                            ? null
                            : weekly.logs[date];
                        const isToday = date === today;
                        const isEditable = isEditableDailyLogDate(date, today);
                        const currentLogKey =
                          leadMeasureId === null ? null : `${leadMeasureId}:${date}`;
                        const isPending =
                          currentLogKey !== null && pendingLogKeys.has(currentLogKey);

                        return (
                          <td key={date} className="py-3 text-center">
                            <Button
                              disabled={
                                isPending || !isEditable || leadMeasureId === null
                              }
                              onClick={() => {
                                if (leadMeasureId !== null && isEditable) {
                                  onBeforeToggle();
                                  void toggleLog(leadMeasureId, date);
                                }
                              }}
                              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
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
                                <Check className="h-3.5 w-3.5" />
                              ) : null}
                            </Button>
                          </td>
                        );
                      })}

                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
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
                              rate >= 100 ? "text-green-600" : "text-text-secondary"
                            }`}
                          >
                            {achievedCount}/{targetValue}
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
