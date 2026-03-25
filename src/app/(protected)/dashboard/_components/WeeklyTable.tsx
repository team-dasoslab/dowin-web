"use client";

import { useGetDashboardTeamMemos } from "@/api/generated/dashboard/dashboard";
import { TeamDashboardMember, TeamDashboardMemberRole } from "@/api/generated/wig.schemas";
import { AchievementProgress } from "@/app/(protected)/dashboard/_components/AchievementProgress";
import { TeamMemberMemoPanel } from "@/app/(protected)/dashboard/_components/TeamMemberMemoPanel";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/Button";
import { getApiErrorStatus, toNumberId } from "@/lib/client/frontend-api";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

type WeeklyTableProps = {
  member: TeamDashboardMember;
  weekDates: string[];
  isMe?: boolean;
  memoMode?: "compose" | "view" | null;
  onToggleCompose?: () => void;
  onToggleView?: () => void;
  onCloseMemo?: () => void;
  currentUserId?: number | null;
  currentUserNickname?: string | null;
  currentUserAvatarKey?: string | null;
  currentUserRole?: TeamDashboardMemberRole | null;
};

export function WeeklyTable({
  member,
  weekDates,
  isMe = false,
  memoMode = null,
  onToggleCompose,
  onToggleView,
  onCloseMemo,
  currentUserId,
  currentUserNickname,
  currentUserAvatarKey,
  currentUserRole,
}: WeeklyTableProps) {
  const memberUserId = toNumberId(member.userId);
  const { data: memoResponse } = useGetDashboardTeamMemos(
    { targetUserId: memberUserId ?? 0 },
    {
      query: {
        enabled: memberUserId !== null,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, queryError) =>
          getApiErrorStatus(queryError) !== 404 && failureCount < 2,
      },
    },
  );

  if (
    !(member.hasScoreboard ?? false) ||
    (member.leadMeasures?.length ?? 0) === 0
  ) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];
  const hasMemos = (memoResponse?.status === 200
    ? memoResponse.data.memos?.length
    : 0) > 0;

  return (
    <div className="relative space-y-2 xl:pr-0">
      <div className="px-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar
              avatarKey={member.avatarKey}
              alt={`${member.nickname ?? "사용자"} 아바타`}
              size={20}
              className="rounded-md"
              fallbackClassName="rounded-md"
              imageClassName="rounded-md"
            />
            <span className="truncate text-xs font-bold text-text-primary">
              {member.nickname}
            </span>
            {isMe ? (
              <span className="rounded border border-primary/25 bg-primary/10 px-1.5 py-0 text-[10px] font-bold text-primary">
                나
              </span>
            ) : null}
            <span className="truncate text-xs text-text-secondary">
              — {member.goalName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasMemos ? (
              <Button
                type="button"
                onClick={onToggleView}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                  memoMode === "view"
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "border-border bg-white text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary"
                }`}
              >
                메모보기
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={onToggleCompose}
              className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                memoMode === "compose"
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-border bg-white text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary"
              }`}
            >
              메모하기
            </Button>
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-3">
        <div className="space-y-3 md:hidden">
          {member.leadMeasures?.map((leadMeasure) => {
            const achievedCount = leadMeasure.achieved ?? 0;
            const targetValue = leadMeasure.targetValue ?? 0;

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
                  <AchievementProgress
                    achievedCount={achievedCount}
                    targetValue={targetValue}
                  />
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
                          <p className="block truncate text-sm font-semibold text-text-primary">
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

      <TeamMemberMemoPanel
        member={member}
        memoMode={memoMode}
        onCloseMemo={onCloseMemo}
        currentUserId={currentUserId}
        currentUserNickname={currentUserNickname}
        currentUserAvatarKey={currentUserAvatarKey}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
