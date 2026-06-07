import { LeadMeasureSummary } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/LeadMeasureSummary";
import { MonthlyMobileCards } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/MonthlyMobileCards";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import { getMonthCalendarWeeks } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";

interface MonthlyBoardSectionProps {
  activeLeadMeasures: ReturnType<typeof useDashboardScoreboard>["activeLeadMeasures"];
  monthLabel?: string;
  monthWeeks: ReturnType<typeof getMonthCalendarWeeks>;
  monthlyLeadMeasures: ReturnType<typeof useDashboardScoreboard>["monthlyLeadMeasures"];
  monthlyOverallRate: number;
  monthlySummary: ReturnType<typeof useDashboardScoreboard>["monthlySummary"];
  today: string;
}

export function MonthlyBoardSection({
  activeLeadMeasures,
  monthLabel,
  monthWeeks,
  monthlyLeadMeasures,
  monthlyOverallRate,
  monthlySummary,
  today,
}: MonthlyBoardSectionProps) {
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
    <div className="space-y-4">


      {monthlyLeadMeasures.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center text-[14px] font-medium text-zinc-500">
          {t("noMonthlyMeasures")}
        </div>
      ) : (
        <>
          <MonthlyMobileCards
            activeLeadMeasures={activeLeadMeasures}
            monthLabel={monthLabel}
            monthWeeks={monthWeeks}
            monthlyLeadMeasures={monthlyLeadMeasures}
            today={today}
          />

          <div className="hidden space-y-4 md:block">
            {monthWeeks.map((weekDatesInMonth, weekIndex) => (
              <div
                key={`${monthLabel}-week-${weekIndex + 1}`}
                className="overflow-hidden rounded-[24px] bg-white"
              >
                <div className="border-b-2 border-zinc-50 bg-white px-6 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-black text-zinc-900">
                      {t("weekNumber", { n: weekIndex + 1 })}
                    </p>
                    <p className="text-[12px] font-mono font-medium text-zinc-500">
                      {weekDatesInMonth.find(Boolean)?.slice(5).replace("-", ".")}
                      {" – "}
                      {weekDatesInMonth
                        .filter((date): date is string => date !== null)
                        .at(-1)
                        ?.slice(5)
                        .replace("-", ".")}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <div className="border-b-2 border-zinc-50 bg-white">
                      <table className="w-full table-fixed text-xs">
                        <colgroup>
                          <col className="w-[34%]" />
                          {localizedDays.map((day) => (
                            <col key={day} className="w-[8%]" />
                          ))}
                          <col className="w-[10%]" />
                          <col className="w-[16%]" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                              {t("leadMeasureHead")}
                            </th>
                            {localizedDays.map((label, dayIndex) => {
                              const date = weekDatesInMonth[dayIndex];
                              const isToday = date === today;

                              return (
                                <th
                                  key={`${weekIndex}-${label}`}
                                  className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest ${
                                    isToday ? "text-primary" : "text-zinc-500"
                                  }`}
                                >
                                  <div>{label}</div>
                                  <div className="mt-0.5 text-[10px] font-mono normal-case tracking-normal">
                                    {date ? date.slice(8, 10) : ""}
                                  </div>
                                </th>
                              );
                            })}
                            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                              {t("period")}
                            </th>
                            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                              {t("achievement")}
                            </th>
                          </tr>
                        </thead>
                      </table>
                    </div>

                    <table className="w-full table-fixed text-xs">
                      <colgroup>
                        <col className="w-[34%]" />
                        {localizedDays.map((day) => (
                          <col key={day} className="w-[8%]" />
                        ))}
                        <col className="w-[10%]" />
                        <col className="w-[16%]" />
                      </colgroup>
                      <tbody className="divide-y-2 divide-zinc-50">
                        {monthlyLeadMeasures.map((leadMeasure) => {
                          const targetValue = leadMeasure.targetValue ?? 0;
                          const tags =
                            tagsByMeasureId.get(leadMeasure.id ?? null) ?? [];
                          const visibleAchievedCount = weekDatesInMonth.reduce(
                            (count, date) => {
                              if (!date) {
                                return count;
                              }

                              return leadMeasure.logs?.[date]?.achieved
                                ? count + 1
                                : count;
                            },
                            0,
                          );
                          const rate =
                            targetValue > 0
                              ? Math.round(
                                  (visibleAchievedCount / targetValue) * 100,
                                )
                              : 0;

                          return (
                            <tr
                              key={`${weekIndex}-${leadMeasure.id}`}
                              className="bg-white"
                            >
                              <td className="px-5 py-4">
                                <LeadMeasureSummary
                                  name={leadMeasure.name}
                                  tags={tags}
                                />
                              </td>

                              {weekDatesInMonth.map((date, dayIndex) => {
                                const value = date
                                  ? (leadMeasure.logs?.[date] ?? null)
                                  : null;
                                const isToday = date === today;

                                return (
                                  <td
                                    key={`${weekIndex}-${leadMeasure.id}-${localizedDays[dayIndex]}`}
                                    className="py-3 text-center"
                                  >
                                  {(() => {
                                    const typedLead = leadMeasure as { trackingMode?: string; dailyTargetCount?: number };
                                    const trackingMode = typedLead.trackingMode;
                                    const dailyTargetCount = typedLead.dailyTargetCount ?? 1;
                                    const isCount = trackingMode === "COUNT";
                                    const count = value?.count ?? 0;
                                    
                                    if (isCount) {
                                      return (
                                        <span
                                          className={`mx-auto flex aspect-square h-9 w-9 items-center justify-center !rounded-[12px] p-0 transition-all ${
                                            value?.achieved
                                              ? "bg-primary text-white"
                                              : count > 0
                                                ? "bg-[#E8F3FF] text-primary"
                                                : date === null
                                                  ? "bg-transparent text-transparent"
                                                  : isToday
                                                    ? "bg-primary/5 text-primary"
                                                    : "bg-zinc-100 text-zinc-500"
                                          }`}
                                        >
                                          <span className="text-[10px] font-bold tracking-tighter leading-none">
                                            {count > 0 ? `${count}/${dailyTargetCount}` : ""}
                                          </span>
                                        </span>
                                      );
                                    }

                                    return (
                                      <span
                                        className={`mx-auto flex aspect-square h-9 w-9 items-center justify-center !rounded-[12px] p-0 transition-colors ${
                                          value?.achieved
                                            ? "bg-primary text-white"
                                            : date === null
                                              ? "bg-transparent text-transparent"
                                              : isToday
                                                ? "bg-[#E8F3FF] text-primary"
                                                : "bg-zinc-100 text-zinc-400"
                                        }`}
                                      >
                                        {value?.achieved ? (
                                          <DowinIcon name="action-checkmark" size="14px" />
                                        ) : null}
                                      </span>
                                    );
                                  })()}
                                </td>
                                );
                              })}

                              <td className="px-3 py-4 text-center text-[12px] font-medium text-zinc-500">
                                {leadMeasure.period === "WEEKLY"
                                  ? t("weeklyLabel")
                                  : t("monthlyLabel")}
                              </td>
                              <td className="px-3 py-4 text-center">
                                <div className="flex flex-col items-center gap-1.5">
                                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-100">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        rate >= 100
                                          ? "bg-green-500"
                                          : "bg-primary"
                                      }`}
                                      style={{
                                        width: `${Math.min(rate, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span
                                    className={`font-mono text-[11px] font-black ${
                                      rate >= 100
                                        ? "text-green-600"
                                        : "text-zinc-500"
                                    }`}
                                  >
                                    {visibleAchievedCount}/{targetValue}
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
            ))}
          </div>
        </>
      )}
    </div>
  );
}
