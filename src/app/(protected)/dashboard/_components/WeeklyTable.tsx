import { TeamDashboardMember } from "@/api/generated/wig.schemas";
import { UserAvatar } from "@/components/UserAvatar";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

type WeeklyTableProps = {
  member: TeamDashboardMember;
  weekDates: string[];
};

export function WeeklyTable({ member, weekDates }: WeeklyTableProps) {
  if (
    !(member.hasScoreboard ?? false) ||
    (member.leadMeasures?.length ?? 0) === 0
  ) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <UserAvatar
          avatarKey={member.avatarKey}
          alt={`${member.nickname ?? "사용자"} 아바타`}
          size={20}
          fallbackClassName="rounded"
        />
        <span className="text-xs font-bold text-text-primary">
          {member.nickname}
        </span>
        <span className="text-xs text-text-secondary">— {member.goalName}</span>
      </div>

      <div className="space-y-3 md:hidden">
        {member.leadMeasures?.map((leadMeasure) => {
          const achievedCount = leadMeasure.achieved ?? 0;
          const targetValue = leadMeasure.targetValue ?? 0;
          const rate =
            targetValue > 0
              ? Math.round((achievedCount / targetValue) * 100)
              : 0;

          return (
            <div
              key={`${member.userId}-${leadMeasure.id}-mobile`}
              className="rounded-lg border border-border bg-white p-4"
            >
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
                <p
                  className={`shrink-0 text-sm font-bold font-mono ${
                    rate >= 100 ? "text-green-600" : "text-text-secondary"
                  }`}
                >
                  {achievedCount}/{targetValue}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {weekDates.map((date, index) => {
                  const value = leadMeasure.logs?.[date] ?? null;

                  return (
                    <div
                      key={`${member.userId}-${leadMeasure.id}-${date}-mobile`}
                      className="space-y-1 text-center"
                    >
                      <p
                        className={`text-[10px] font-bold ${
                          date === today ? "text-primary" : "text-text-muted"
                        }`}
                      >
                        {DAY_LABELS[index]}
                      </p>
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center text-sm font-bold ${
                          value === true
                            ? "text-green-600"
                            : date === today
                              ? "text-primary/50"
                              : "text-text-muted"
                        }`}
                      >
                        {value === true ? "○" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="bg-sub-background border-b border-border">
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
                    <th className="py-3 px-5 text-left text-[11px] font-bold text-text-muted uppercase tracking-widest">
                      선행지표
                    </th>
                    {DAY_LABELS.map((day, index) => (
                      <th
                        key={day}
                        className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest ${
                          weekDates[index] === today
                            ? "text-primary"
                            : weekDates[index] > today
                              ? "text-text-muted/50"
                              : "text-text-muted"
                        }`}
                      >
                        {day}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-widest">
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
                {member.leadMeasures?.map((leadMeasure) => {
                  const achievedCount = leadMeasure.achieved ?? 0;
                  const targetValue = leadMeasure.targetValue ?? 0;
                  const rate =
                    targetValue > 0
                      ? Math.round((achievedCount / targetValue) * 100)
                      : 0;

                  return (
                    <tr key={leadMeasure.id} className="bg-white">
                      <td className="py-4 px-5">
                        <p className="block font-semibold text-text-primary truncate text-sm">
                          {leadMeasure.name}
                        </p>
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
                        const value = leadMeasure.logs?.[date] ?? null;

                        return (
                          <td key={date} className="py-3 text-center">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center text-sm font-bold ${
                                value === true
                                  ? "text-green-600"
                                  : date === today
                                    ? "text-primary/50"
                                    : "text-text-muted"
                              }`}
                            >
                              {value === true ? "○" : ""}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-4 px-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-10 h-1 bg-sub-background rounded-full overflow-hidden border border-border">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                rate >= 100 ? "bg-green-500" : "bg-primary"
                              }`}
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-bold font-mono ${
                              rate >= 100
                                ? "text-green-600"
                                : "text-text-secondary"
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
    </div>
  );
}
