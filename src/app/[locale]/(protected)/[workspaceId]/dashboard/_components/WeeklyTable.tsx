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
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { toNumberId } from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
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
  const { showToast } = useToast();
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

  if (
    !(member.hasScoreboard ?? false) ||
    (member.leadMeasures?.length ?? 0) === 0
  ) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];
  const hasMemos = memos.length > 0;

  const handleComposeClick = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1599px)").matches
    ) {
      const content =
        window.prompt("메모 내용을 입력하세요.", "")?.trim() ?? "";

      if (!content) {
        return;
      }

      void (async () => {
        const isSuccess = await createMemo(content);

        if (isSuccess) {
          showToast("success", t("addedMemo"));
        }
      })();
      return;
    }

    onToggleCompose?.();
  };

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
              <span className="truncate text-[13px] font-black text-zinc-900">
                {member.nickname}
              </span>
              {isMe ? (
                <span className="shrink-0 rounded-[12px] border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {tc("me")}
                </span>
              ) : null}
              <span className="hidden truncate text-[12px] font-medium text-zinc-500 sm:inline">
                — {member.goalName}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {hasMemos ? (
                <Button
                  type="button"
                  onClick={onToggleView}
                  className={`rounded-[14px] px-2.5 py-1.5 text-xs font-bold transition-colors sm:px-3 sm:py-2 ${
                    memoMode === "view"
                      ? "bg-primary/10 text-primary"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {t("viewMemos")}
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={handleComposeClick}
                className={`rounded-[14px] px-2.5 py-1.5 text-xs font-bold transition-colors sm:px-3 sm:py-2 ${
                  memoMode === "compose"
                    ? "bg-primary/10 text-primary"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {t("memoButton")}
              </Button>
            </div>
          </div>
          <div className="sm:hidden">
            <p className="text-[12px] font-medium leading-relaxed text-zinc-500">
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
                className="rounded-[24px] bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <LeadMeasureSummary name={leadMeasure.name} />
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
                    const logData = leadMeasure.logs?.[date] as import("@/api/generated/dowin.schemas").DailyLogCell | null | undefined;
                    const isAchieved = logData?.achieved ?? false;
                    const count = logData?.count ?? null;
                    const typedLead = leadMeasure as { trackingMode?: string; dailyTargetCount?: number };
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

        <div className="hidden overflow-hidden rounded-[24px] bg-white md:block">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="border-b-2 border-zinc-50 bg-white">
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
                      <th className="py-3 px-5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                        {t("leadMeasureHead")}
                      </th>
                      {DAY_KEYS.map((dayKey, index) => (
                        <th
                          key={dayKey}
                          className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest ${
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
                      <th className="py-3 px-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
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
                <tbody className="divide-y-2 divide-zinc-50">
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
                      <tr key={leadMeasure.id} className="bg-white">
                        <td className="py-4 px-5">
                          <LeadMeasureSummary
                            name={leadMeasure.name}
                            nameClassName="block text-sm font-semibold text-zinc-900"
                          />
                        </td>
                        {weekDates.map((date) => {
                          const logData = leadMeasure.logs?.[date] as import("@/api/generated/dowin.schemas").DailyLogCell | null | undefined;
                          const isAchieved = logData?.achieved ?? false;
                          const count = logData?.count ?? null;
                          const typedLeadDesktop = leadMeasure as { trackingMode?: string; dailyTargetCount?: number };
                          const trackingMode = typedLeadDesktop.trackingMode;
                          const dailyTargetCount = typedLeadDesktop.dailyTargetCount ?? 1;
                          const isCount = trackingMode === "COUNT";

                          return (
                            <td key={date} className="py-3 text-center">
                              {isCount ? (
                                <span
                                  className={`inline-flex h-7 min-w-[1.75rem] px-1 items-center justify-center text-[10px] font-bold ${
                                    isAchieved
                                      ? "text-green-600"
                                      : count != null && count > 0
                                        ? "text-zinc-900"
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
                            <span className="text-[11px] font-medium text-zinc-500">
                              {leadMeasure.period === "MONTHLY"
                                ? t("monthView")
                                : t("weekView")}
                            </span>
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  rate >= 100 ? "bg-green-500" : "bg-primary"
                                }`}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                            <span
                              className={`font-mono text-[11px] font-black ${
                                rate >= 100
                                  ? "text-green-600"
                                  : "text-zinc-500"
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
