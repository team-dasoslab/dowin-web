"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { MemberCard } from "@/app/[locale]/(protected)/dashboard/_components/MemberCard";
import { WeeklyTable } from "@/app/[locale]/(protected)/dashboard/_components/WeeklyTable";
import { useTeamDashboard } from "@/app/[locale]/(protected)/dashboard/_hooks/useTeamDashboard";
import { formatWeekLabel } from "@/app/[locale]/(protected)/dashboard/_lib/dashboard";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { trackEvent } from "@/lib/client/gtag";
import { Calendar, UserIcon, Users, Zap } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type ActiveMemoState = {
  memberId: number;
  mode: "compose" | "view";
} | null;

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const { dashboard, hasNoWorkspace, isLoading, weekDates } =
    useTeamDashboard();
  const { data: profileResponse } = useGetUsersMe();
  const [activeMemoState, setActiveMemoState] = useState<ActiveMemoState>(null);
  const myUserId =
    profileResponse?.status === 200 ? (profileResponse.data.id ?? null) : null;
  const myNickname =
    profileResponse?.status === 200 ? profileResponse.data.nickname : null;
  const myAvatarKey =
    profileResponse?.status === 200 ? profileResponse.data.avatarKey : null;
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (isLoading || hasNoWorkspace || !dashboard || hasTrackedViewRef.current) {
      return;
    }

    const memberCount = dashboard.members?.length ?? 0;
    const memberCountBucket =
      memberCount <= 1
        ? "1"
        : memberCount <= 5
          ? "2_5"
          : memberCount <= 15
            ? "6_15"
            : "16_plus";

    trackEvent("dashboard_team_viewed", {
      member_count_bucket: memberCountBucket,
    });
    hasTrackedViewRef.current = true;
  }, [dashboard, hasNoWorkspace, isLoading]);

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (hasNoWorkspace || !dashboard) {
    return <DashboardNoWorkspaceState />;
  }

  const weekLabel = formatWeekLabel(dashboard.weekStart, dashboard.weekEnd);
  const members = dashboard.members ?? [];
  const membersWithScoreboard = members.filter(
    (member) => member.hasScoreboard,
  );
  const currentUserRole =
    members.find((member) => member.userId === myUserId)?.role ?? null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-pretendard">
      <div
        className={`mx-auto max-w-[860px] p-4 md:p-8 animate-linear-in transition-transform duration-300 ease-out xl:origin-top ${
          activeMemoState ? "xl:-translate-x-28" : "xl:translate-x-0"
        }`}
      >
        <div className="space-y-10">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-text-primary tracking-tight truncate">
                  {dashboard.workspaceName}
                </h1>
                <p className="text-[11px] text-text-muted truncate">
                  {t("teamStatus")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
              >
                <Link href="/dashboard/my">
                  <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span>{t("myDashboard")}</span>
                </Link>
              </Button>
              <Button
                asChild
                className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
              >
                <Link href="/profile">
                  <UserIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span>{t("myProfile")}</span>
                </Link>
              </Button>
            </div>
          </header>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-text-primary">
                {t("memberSummary")}
              </h2>
              <span className="text-[11px] text-text-muted bg-sub-background border border-border px-2 py-1 rounded font-mono">
                {weekLabel}
              </span>
            </div>

            {members.length === 0 ? (
              <div className="border border-border rounded-lg p-8 text-center text-text-muted text-sm">
                {t("noMembers")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member) => (
                  <MemberCard
                    key={member.userId}
                    member={member}
                    isMe={member.userId === myUserId}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="border-t border-border" />

          <section className="space-y-6 overflow-visible">
            <div className="px-1">
              <div>
                <h2 className="text-sm font-bold text-text-primary">
                  {t("teamWeeklyScoreboard")}
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  {t("teamWeeklyScoreboardDesc")}
                </p>
              </div>
            </div>

            {membersWithScoreboard.length === 0 ? (
              <div className="border border-border rounded-lg p-8 text-center text-text-muted text-sm">
                {t("noActiveScoreboards")}
              </div>
            ) : (
              membersWithScoreboard.map((member) => (
                <WeeklyTable
                  key={member.userId}
                  member={member}
                  weekDates={weekDates}
                  isMe={member.userId === myUserId}
                  memoMode={
                    activeMemoState != null &&
                    activeMemoState.memberId === member.userId
                      ? activeMemoState.mode
                      : null
                  }
                  onToggleCompose={() =>
                    setActiveMemoState((prev) =>
                      prev != null &&
                      prev.memberId === member.userId &&
                      prev.mode === "compose"
                        ? null
                        : member.userId != null
                          ? { memberId: member.userId, mode: "compose" }
                          : null,
                    )
                  }
                  onToggleView={() =>
                    setActiveMemoState((prev) =>
                      prev != null &&
                      prev.memberId === member.userId &&
                      prev.mode === "view"
                        ? null
                        : member.userId != null
                          ? { memberId: member.userId, mode: "view" }
                          : null,
                    )
                  }
                  onCloseMemo={() => setActiveMemoState(null)}
                  currentUserId={myUserId}
                  currentUserNickname={myNickname}
                  currentUserAvatarKey={myAvatarKey}
                  currentUserRole={currentUserRole}
                />
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardLoadingState() {
  const t = useTranslations("Dashboard");
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-16 rounded-2xl bg-sub-background" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-48 rounded-2xl bg-sub-background" />
          <div className="h-48 rounded-2xl bg-sub-background" />
        </div>
        <div className="h-64 rounded-2xl bg-sub-background" />
      </div>
    </div>
  );
}

function DashboardNoWorkspaceState() {
  const t = useTranslations("Dashboard");
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[720px] mx-auto p-4 md:p-8">
        <Card className="card-linear p-8 text-center space-y-4">
          <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {t("noWorkspaceTitle")}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("noWorkspaceDesc")}
          </p>
          <div className="flex justify-center">
            <NoWorkspaceActions />
          </div>
        </Card>
      </div>
    </div>
  );
}
