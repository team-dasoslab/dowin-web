"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import { MemberCard } from "@/app/[locale]/(protected)/dashboard/_components/MemberCard";
import { WeeklyTable } from "@/app/[locale]/(protected)/dashboard/_components/WeeklyTable";
import { useTeamDashboard } from "@/app/[locale]/(protected)/dashboard/_hooks/useTeamDashboard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { Plus, Users, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { EmptyStatePanel } from "../_components/EmptyStatePanel";
import { formatWeekLabel } from "./_lib/dashboard";

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
    if (
      isLoading ||
      hasNoWorkspace ||
      !dashboard ||
      hasTrackedViewRef.current
    ) {
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
      workspace_id_hash: hashId(dashboard.workspaceId),
    });
    hasTrackedViewRef.current = true;
  }, [dashboard, hasNoWorkspace, isLoading]);

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  const members = dashboard?.members ?? [];
  const membersWithScoreboard = members.filter(
    (member) => member.hasScoreboard,
  );

  if (hasNoWorkspace || !dashboard) {
    return <DashboardNoWorkspaceState />;
  }

  if (membersWithScoreboard.length === 0) {
    return <DashboardNoScoreboardState />;
  }

  const weekLabel = formatWeekLabel(dashboard.weekStart, dashboard.weekEnd);
  const currentUserRole =
    members.find((member) => member.userId === myUserId)?.role ?? null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] font-pretendard">
      <div
        className={`mx-auto max-w-[1200px] p-6 md:p-10 lg:p-12 animate-linear-in transition-transform duration-300 ease-out xl:origin-top ${
          activeMemoState ? "xl:-translate-x-28" : "xl:translate-x-0"
        }`}
      >
        <div className="space-y-10">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black text-zinc-900 tracking-tight">
                  {t("teamStatus")}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2"></div>
          </header>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-text-primary">
                {t("memberSummary")}
              </h2>
              <span className="text-[11px] font-bold text-zinc-600 bg-white border border-zinc-200 px-2.5 py-1 rounded-content font-mono">
                {weekLabel}
              </span>
            </div>

            {members.length === 0 ? (
              <div className="border border-border rounded-content p-8 text-center text-text-muted text-sm">
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

            {membersWithScoreboard.map((member) => (
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
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardLoadingState() {
  const t = useTranslations("Dashboard");
  return (
    <div className="min-h-screen bg-zinc-50/50 font-pretendard">
      <div className="max-w-[1200px] mx-auto p-6 md:p-10 lg:p-12 space-y-10 animate-pulse">
        <div className="h-16 rounded-content bg-sub-background" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-48 rounded-content bg-sub-background" />
          <div className="h-48 rounded-content bg-sub-background" />
        </div>
        <div className="h-64 rounded-content bg-sub-background" />
      </div>
    </div>
  );
}

function DashboardNoWorkspaceState() {
  const t = useTranslations("Dashboard");
  return (
    <div className="min-h-screen bg-zinc-50/50 font-pretendard">
      <div className="max-w-[1200px] mx-auto flex min-h-screen items-center p-6 md:p-10 lg:p-12">
        <EmptyStatePanel
          icon={<Users className="w-5 h-5 text-primary" />}
          title={t("noWorkspaceTitle")}
          description={t("noWorkspaceDesc")}
          actions={<NoWorkspaceActions />}
        />
      </div>
    </div>
  );
}

function DashboardNoScoreboardState() {
  const t = useTranslations("Dashboard");
  return (
    <div className="min-h-screen bg-zinc-50/50 font-pretendard">
      <div className="max-w-[1200px] mx-auto flex min-h-screen items-center p-6 md:p-10 lg:p-12">
        <EmptyStatePanel
          icon={<Zap className="w-5 h-5 text-primary" />}
          title={t("noScoreboardTitle")}
          description={t("noScoreboardDesc")}
          actions={
            <Button
              asChild
              className="btn-linear-primary flex items-center gap-2 w-fit px-5 py-3 text-sm rounded-button"
            >
              <Link href="/setup?mode=create">
                <Plus className="w-4 h-4" />
                {t("createScoreboard")}
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
