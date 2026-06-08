"use client";

import { TeamDashboardMember } from "@/api/generated/dowin.schemas";
import { UserAvatar } from "@/components/UserAvatar";
import { Logo } from "@/components/ui/Logo";
import { getLeadMeasureProgress } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_lib/scoreboard-image";
import { useTranslations } from "next-intl";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type ScoreboardImageCardProps = {
  workspaceName: string;
  member: TeamDashboardMember;
  weekDates: string[];
  weekLabel: string;
};

export function ScoreboardImageCard({
  workspaceName,
  member,
  weekDates,
  weekLabel,
}: ScoreboardImageCardProps) {
  const t = useTranslations("Dashboard");
  const tc = useTranslations("Common");

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="w-[1080px] bg-zinc-100 p-12 text-zinc-950">
      <div className="rounded-[24px] bg-white p-10 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2 text-[15px] font-bold text-zinc-500 tracking-tight">
            <span>{workspaceName}</span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-900">{weekLabel}</span>
          </div>
          <Logo className="h-5 w-auto text-zinc-300 grayscale" />
        </div>

        {/* User Info & Goals */}
        <div className="mt-6 flex items-center justify-between gap-8">
          <div className="flex flex-1 items-center gap-5 min-w-0">
            <UserAvatar
              avatarKey={member.avatarKey}
              avatarSeed={member.nickname}
              alt={`${member.nickname ?? "사용자"} 아바타`}
              size={64}
            />
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-xl font-black text-zinc-900 truncate mb-1.5">
                {member.nickname}
              </span>
              <p className="text-[15px] font-bold text-zinc-800 break-words line-clamp-2 leading-snug">
                {member.goalName || "-"}
              </p>
              <p className="text-[13px] font-medium text-zinc-500 break-words line-clamp-2 mt-0.5">
                {member.lagMeasure || "-"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-zinc-50 px-6 py-4 min-w-[130px]">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                {t("weeklyAchievement", { fallback: "주간 달성률" })}
              </span>
              <span className="text-2xl font-black text-primary">
                {member.weeklyAchievementRate ?? 0}%
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-zinc-50 px-6 py-4 min-w-[130px]">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                {t("monthlyAchievement", { fallback: "월간 달성률" })}
              </span>
              <span className="text-2xl font-black text-zinc-700">
                {member.monthlyAchievementRate ?? 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="mt-8 rounded-2xl border border-zinc-100 overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[35%]" />
              {DAY_KEYS.map((dayKey) => (
                <col key={dayKey} className="w-[7.5%]" />
              ))}
              <col className="w-[12.5%]" />
            </colgroup>
            <thead className="bg-zinc-50">
              <tr>
                <th className="py-4 px-6 text-left text-[12px] font-bold text-zinc-500 uppercase tracking-widest">
                  {t("leadMeasureHead")}
                </th>
                {DAY_KEYS.map((dayKey, index) => (
                  <th
                    key={dayKey}
                    className={`py-4 text-center text-[12px] font-bold uppercase tracking-widest ${
                      weekDates[index] === today
                        ? "text-primary"
                        : weekDates[index] > today
                          ? "text-zinc-500/50"
                          : "text-zinc-500"
                    }`}
                  >
                    {t(dayKey)}
                  </th>
                ))}
                <th className="py-4 px-4 text-center text-[12px] font-bold text-zinc-500 uppercase tracking-widest">
                  {t("achievementTab")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {member.leadMeasures?.map((leadMeasure) => {
                const { achieved, total, rate } = getLeadMeasureProgress(leadMeasure);
                const typedLeadDesktop = leadMeasure as { trackingMode?: string; dailyTargetCount?: number };
                const trackingMode = typedLeadDesktop.trackingMode;
                const dailyTargetCount = typedLeadDesktop.dailyTargetCount ?? 1;
                const isCount = trackingMode === "COUNT";

                return (
                  <tr key={leadMeasure.id} className="bg-white">
                    <td className="py-5 px-6">
                      <p className="text-[14px] font-semibold text-zinc-900 break-words line-clamp-2 leading-relaxed">
                        {leadMeasure.name}
                      </p>
                    </td>
                    {weekDates.map((date) => {
                      const logData = leadMeasure.logs?.[date] as import("@/api/generated/dowin.schemas").DailyLogCell | null | undefined;
                      const isAchieved = logData?.achieved ?? false;
                      const count = logData?.count ?? null;

                      return (
                        <td key={date} className="py-5 text-center align-middle">
                          {isCount ? (
                            <span
                              className={`inline-flex items-center justify-center text-[12px] font-bold ${
                                isAchieved
                                  ? "text-green-600"
                                  : count != null && count > 0
                                    ? "text-zinc-900"
                                    : date === today
                                      ? "text-primary/50"
                                      : "text-zinc-300"
                              }`}
                            >
                              {count != null && count > 0
                                ? `${count}/${dailyTargetCount}`
                                : ""}
                            </span>
                          ) : (
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center text-[16px] font-bold ${
                                isAchieved
                                  ? "text-green-600"
                                  : date === today
                                    ? "text-primary/50"
                                    : "text-zinc-300"
                              }`}
                            >
                              {isAchieved ? "○" : ""}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-5 px-4 text-center align-middle">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-[12px] font-medium text-zinc-500">
                          {leadMeasure.period === "MONTHLY"
                            ? t("monthView")
                            : t("weekView")}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              rate >= 100 ? "bg-green-500" : "bg-primary"
                            }`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono text-[13px] font-black tracking-tight ${
                            rate >= 100 ? "text-green-600" : "text-zinc-600"
                          }`}
                        >
                          {achieved}/{total}
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
  );
}
