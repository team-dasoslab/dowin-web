"use client";

import {
  TeamDashboardMember,
  TeamDashboardMemberRole,
} from "@/api/generated/dowin.schemas";
import { AchievementProgress } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/AchievementProgress";
import { LeadMeasureSummary } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/LeadMeasureSummary";
import { TeamMemberMemoPanel } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/TeamMemberMemoPanel";
import { useTeamMemos } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_hooks/useTeamMemos";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import { toNumberId } from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useWeeklyTableActions } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_hooks/useWeeklyTableActions";
import { useParams } from "next/navigation";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

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
  const t = useTranslations("Dashboard");
  const tc = useTranslations("Common");
  const memberUserId = toNumberId(member.userId);
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const {
    memos,
    isLoading: isMemosLoading,
    isError: isMemosError,
    isCreatePending,
    isResolvePending,
    isDeletePending,
    createMemo,
    resolveMemo,
    deleteMemo,
  } = useTeamMemos({
    workspaceId,
    targetUserId: memberUserId,
    enabled: true,
    currentUser: {
      id: currentUserId,
      nickname: currentUserNickname,
      avatarKey: currentUserAvatarKey,
    },
  });

  const { handleComposeClick } = useWeeklyTableActions(createMemo, onToggleCompose);

  if (
    !(member.hasScoreboard ?? false) ||
    (member.leadMeasures?.length ?? 0) === 0
  ) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];
  const hasMemos = memos.length > 0;

  return (
    <div className="relative space-y-2 xl:pr-0">
      <div className="px-1">
        <div className="flex flex-col gap-1.5 sm:gap-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar
                avatarKey={member.avatarKey}
                avatarSeed={member.nickname}
                alt={`${member.nickname ?? "사용자"} 아바타`}
                size={20}
              />
              <span className="truncate text-[13px] font-black text-text-primary">
                {member.nickname}
              </span>
              {isMe ? (
                <Badge variant="primary" size="sm" shape="pill" className="shrink-0">
                  {tc("me")}
                </Badge>
              ) : null}
              <span className="hidden truncate text-[12px] font-medium text-text-muted sm:inline">
                — {member.goalName}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {hasMemos ? (
                <Button
                  type="button"
                  onClick={onToggleView}
                  className={`h-10 px-4 text-[13px] font-black !rounded-2xl transition-all ${
                    memoMode === "view"
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-surface text-text-primary hover:bg-sub-background"
                  }`}
                >
                  {t("viewMemos")}
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={handleComposeClick}
                className={`h-10 px-4 text-[13px] font-black !rounded-2xl transition-all ${
                  memoMode === "compose"
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-surface text-text-primary hover:bg-sub-background"
                }`}
              >
                {t("memoButton")}
              </Button>
            </div>
          </div>
          <div className="sm:hidden">
            <p className="text-[12px] font-medium leading-relaxed text-text-muted">
              {member.goalName}
            </p>
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
                className="rounded-[24px] bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <LeadMeasureSummary 
                    name={leadMeasure.name}
                    achieved={leadMeasure.achieved}
                    lastWeekAchieved={leadMeasure.lastWeekAchieved}
                  />
                  <AchievementProgress
                    achievedCount={achievedCount}
                    periodLabel={
                      leadMeasure.period === "MONTHLY"
                        ? t("monthView")
                        : t("weekView")
                    }
                    targetValue={targetValue}
                  />
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {weekDates.map((date, index) => {
                    const logData = leadMeasure.logs?.[date] as
                      | import("@/api/generated/dowin.schemas").DailyLogCell
                      | null
                      | undefined;
                    const isAchieved = logData?.achieved ?? false;
                    const count = logData?.count ?? null;
                    const typedLead = leadMeasure as {
                      trackingMode?: string;
                      dailyTargetCount?: number;
                    };
                    const trackingMode = typedLead.trackingMode;
                    const dailyTargetCount = typedLead.dailyTargetCount ?? 1;
                    const isCount = trackingMode === "COUNT";

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
                          {t(DAY_KEYS[index])}
                        </p>
                        {isCount ? (
                          <span
                            className={`inline-flex h-7 min-w-[1.75rem] px-1 items-center justify-center text-[10px] font-bold ${
                              isAchieved
                                ? "text-green-600"
                                : count != null && count > 0
                                  ? "text-text-primary"
                                  : date === today
                                    ? "text-primary/50"
                                    : "text-text-muted"
                            }`}
                          >
                            {count != null && count > 0
                              ? `${count}/${dailyTargetCount}`
                              : ""}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center text-sm font-bold ${
                              isAchieved
                                ? "text-green-600"
                                : date === today
                                  ? "text-primary/50"
                                  : "text-text-muted"
                            }`}
                          >
                            {isAchieved ? "○" : ""}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-hidden rounded-[24px] bg-surface md:block">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="border-b border-border bg-surface">
                <table className="w-full table-fixed text-xs">
                  <colgroup>
                    <col className="w-[38%]" />
                    {DAY_KEYS.map((dayKey) => (
                      <col key={dayKey} className="w-[8%]" />
                    ))}
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="py-3 px-5 text-left text-[11px] font-bold text-text-muted uppercase tracking-widest">
                        {t("leadMeasureHead")}
                      </th>
                      {DAY_KEYS.map((dayKey, index) => (
                        <th
                          key={dayKey}
                          className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest ${
                            weekDates[index] === today
                              ? "text-primary"
                              : weekDates[index] > today
                                ? "text-text-muted/50"
                                : "text-text-muted"
                          }`}
                        >
                          {t(dayKey)}
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-widest">
                        {t("achievementTab")}
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              <table className="w-full table-fixed text-xs">
                <colgroup>
                  <col className="w-[38%]" />
                  {DAY_KEYS.map((dayKey) => (
                    <col key={dayKey} className="w-[8%]" />
                  ))}
                  <col className="w-[14%]" />
                </colgroup>
                <tbody className="divide-y divide-border">
                  {member.leadMeasures?.map((leadMeasure) => {
                    const achievedCount = leadMeasure.achieved ?? 0;
                    const targetValue = leadMeasure.targetValue ?? 0;
                    const weeklyTotal =
                      (leadMeasure as { total?: number }).total ?? targetValue;
                    const rate =
                      weeklyTotal > 0
                        ? Math.round((achievedCount / weeklyTotal) * 100)
                        : 0;

                    return (
                      <tr key={leadMeasure.id} className="bg-surface">
                        <td className="py-4 px-5">
                          <LeadMeasureSummary
                            name={leadMeasure.name}
                            achieved={leadMeasure.achieved}
                            lastWeekAchieved={leadMeasure.lastWeekAchieved}
                            nameClassName="block text-sm font-semibold text-text-primary"
                          />
                        </td>
                        {weekDates.map((date) => {
                          const logData = leadMeasure.logs?.[date] as
                            | import("@/api/generated/dowin.schemas").DailyLogCell
                            | null
                            | undefined;
                          const isAchieved = logData?.achieved ?? false;
                          const count = logData?.count ?? null;
                          const typedLeadDesktop = leadMeasure as {
                            trackingMode?: string;
                            dailyTargetCount?: number;
                          };
                          const trackingMode = typedLeadDesktop.trackingMode;
                          const dailyTargetCount =
                            typedLeadDesktop.dailyTargetCount ?? 1;
                          const isCount = trackingMode === "COUNT";

                          return (
                            <td key={date} className="py-3 text-center">
                              {isCount ? (
                                <span
                                  className={`inline-flex h-7 min-w-[1.75rem] px-1 items-center justify-center text-[10px] font-bold ${
                                    isAchieved
                                      ? "text-green-600"
                                      : count != null && count > 0
                                        ? "text-text-primary"
                                        : date === today
                                          ? "text-primary/50"
                                          : "text-text-muted"
                                  }`}
                                >
                                  {count != null && count > 0
                                    ? `${count}/${dailyTargetCount}`
                                    : ""}
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex h-7 w-7 items-center justify-center text-sm font-bold ${
                                    isAchieved
                                      ? "text-green-600"
                                      : date === today
                                        ? "text-primary/50"
                                        : "text-text-muted"
                                  }`}
                                >
                                  {isAchieved ? "○" : ""}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-4 px-3 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[11px] font-medium text-text-muted">
                              {leadMeasure.period === "MONTHLY"
                                ? t("monthView")
                                : t("weekView")}
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
      </div>

      <TeamMemberMemoPanel
        member={member}
        memoMode={memoMode}
        onCloseMemo={onCloseMemo}
        memos={memos}
        isMemosLoading={isMemosLoading}
        isMemosError={isMemosError}
        isCreatePending={isCreatePending}
        isResolvePending={isResolvePending}
        isDeletePending={isDeletePending}
        createMemo={createMemo}
        resolveMemo={resolveMemo}
        deleteMemo={deleteMemo}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
