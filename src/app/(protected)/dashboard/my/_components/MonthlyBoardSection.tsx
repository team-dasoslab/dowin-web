import { useDashboardScoreboard } from "@/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { MonthlyMobileCards } from "@/app/(protected)/dashboard/my/_components/MonthlyMobileCards";
import { DAY_LABELS, getMonthCalendarWeeks } from "@/app/(protected)/dashboard/my/_lib/week";
import { Check } from "lucide-react";

interface MonthlyBoardSectionProps {
  monthLabel?: string;
  monthWeeks: ReturnType<typeof getMonthCalendarWeeks>;
  monthlyLeadMeasures: ReturnType<typeof useDashboardScoreboard>["monthlyLeadMeasures"];
  monthlyOverallRate: number;
  monthlySummary: ReturnType<typeof useDashboardScoreboard>["monthlySummary"];
  today: string;
}

export function MonthlyBoardSection({
  monthLabel,
  monthWeeks,
  monthlyLeadMeasures,
  monthlyOverallRate,
  monthlySummary,
  today,
}: MonthlyBoardSectionProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-white px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-text-primary">월간 기록판</p>
            <p className="text-[11px] text-text-muted">
              선택한 달 전체 기록을 주차 흐름으로 보여줍니다.
            </p>
          </div>
          <p className="text-[11px] text-text-muted">
            총 {monthlySummary?.achieved ?? 0}/{monthlySummary?.total ?? 0} ·{" "}
            {monthlyOverallRate}%
          </p>
        </div>
      </div>

      {monthlyLeadMeasures.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-text-muted">
          선택한 달에 집계할 월간 선행지표가 없습니다.
        </div>
      ) : (
        <>
          <MonthlyMobileCards
            monthLabel={monthLabel}
            monthWeeks={monthWeeks}
            monthlyLeadMeasures={monthlyLeadMeasures}
            today={today}
          />

          <div className="hidden space-y-4 md:block">
            {monthWeeks.map((weekDatesInMonth, weekIndex) => (
              <div
                key={`${monthLabel}-week-${weekIndex + 1}`}
                className="overflow-hidden rounded-lg border border-border bg-white"
              >
                <div className="border-b border-border bg-sub-background px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-text-primary">
                      {weekIndex + 1}주차
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
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <div className="border-b border-border bg-sub-background">
                      <table className="w-full table-fixed text-xs">
                        <colgroup>
                          <col className="w-[34%]" />
                          {DAY_LABELS.map((day) => (
                            <col key={day} className="w-[8%]" />
                          ))}
                          <col className="w-[10%]" />
                          <col className="w-[16%]" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-text-muted">
                              선행지표
                            </th>
                            {DAY_LABELS.map((label, dayIndex) => {
                              const date = weekDatesInMonth[dayIndex];
                              const isToday = date === today;

                              return (
                                <th
                                  key={`${weekIndex}-${label}`}
                                  className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest ${
                                    isToday ? "text-primary" : "text-text-muted"
                                  }`}
                                >
                                  <div>{label}</div>
                                  <div className="mt-0.5 text-[10px] font-mono normal-case tracking-normal">
                                    {date ? date.slice(8, 10) : ""}
                                  </div>
                                </th>
                              );
                            })}
                            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-muted">
                              기간
                            </th>
                            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-muted">
                              달성
                            </th>
                          </tr>
                        </thead>
                      </table>
                    </div>

                    <table className="w-full table-fixed text-xs">
                      <colgroup>
                        <col className="w-[34%]" />
                        {DAY_LABELS.map((day) => (
                          <col key={day} className="w-[8%]" />
                        ))}
                        <col className="w-[10%]" />
                        <col className="w-[16%]" />
                      </colgroup>
                      <tbody className="divide-y divide-border">
                        {monthlyLeadMeasures.map((leadMeasure) => {
                          const targetValue = leadMeasure.targetValue ?? 0;
                          const visibleAchievedCount = weekDatesInMonth.reduce(
                            (count, date) => {
                              if (!date) {
                                return count;
                              }

                              return leadMeasure.logs?.[date] === true
                                ? count + 1
                                : count;
                            },
                            0,
                          );
                          const rate =
                            targetValue > 0
                              ? Math.round((visibleAchievedCount / targetValue) * 100)
                              : 0;

                          return (
                            <tr
                              key={`${weekIndex}-${leadMeasure.id}`}
                              className="bg-white"
                            >
                              <td className="px-5 py-4">
                                <p className="truncate text-sm font-semibold text-text-primary">
                                  {leadMeasure.name}
                                </p>
                                <p className="text-[10px] text-text-muted">
                                  목표 {targetValue}회 /{" "}
                                  {leadMeasure.period === "WEEKLY" ? "주" : "월"}
                                </p>
                              </td>

                              {weekDatesInMonth.map((date, dayIndex) => {
                                const value = date
                                  ? (leadMeasure.logs?.[date] ?? null)
                                  : null;
                                const isToday = date === today;

                                return (
                                  <td
                                    key={`${weekIndex}-${leadMeasure.id}-${DAY_LABELS[dayIndex]}`}
                                    className="py-3 text-center"
                                  >
                                    <span
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm font-bold ${
                                        value === true
                                          ? "border-primary bg-primary text-white"
                                          : date === null
                                            ? "border-transparent bg-transparent text-transparent"
                                            : isToday
                                              ? "border-primary/30 bg-primary/5 text-primary"
                                              : "border-border bg-sub-background text-text-muted"
                                      }`}
                                    >
                                      {value === true ? (
                                        <Check className="h-3.5 w-3.5" />
                                      ) : null}
                                    </span>
                                  </td>
                                );
                              })}

                              <td className="px-3 py-4 text-center text-[11px] text-text-secondary">
                                {leadMeasure.period === "WEEKLY" ? "주간" : "월간"}
                              </td>
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
