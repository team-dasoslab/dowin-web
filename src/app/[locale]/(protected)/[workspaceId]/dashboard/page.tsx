"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { TeamPeriodControls } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/TeamPeriodControls";
import { MemberCard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/MemberCard";
import { WeeklyTable } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/WeeklyTable";
import { useTeamDashboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_hooks/useTeamDashboard";
import { PageSidebarNav } from "@/components/PageSidebarNav";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { PeriodBadge } from "@/components/ui/PeriodBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/routing";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";

type ActiveMemoState = {
  memberId: number;
  mode: "compose" | "view";
} | null;

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const {
    dashboard,
    hasNoWorkspace,
    isLoading,
    isPeriodLoading,
    isPreviousDisabled,
    isResetVisible,
    movePeriod,
    resetToToday,
    selectedDate,
    setSelectedDate,
    weekDates,
    weekLabel,
  } = useTeamDashboard(useParams().workspaceId as string);
  const { data: profileResponse } = useGetUsersMe();
  const [activeMemoState, setActiveMemoState] = useState<ActiveMemoState>(null);
  const myUserId =
    profileResponse?.status === 200 ? (profileResponse.data.id ?? null) : null;
  const myNickname =
    profileResponse?.status === 200 ? profileResponse.data.nickname : null;
  const myAvatarKey =
    profileResponse?.status === 200 ? profileResponse.data.avatarKey : null;
  const hasTrackedViewRef = useRef(false);

  const [activeSection, setActiveSection] = useState("summary");

  const menuGroups = useMemo(
    () => [
      { id: "summary", label: t("memberSummary") },
      { id: "scoreboard", label: t("teamWeeklyScoreboard") },
    ],
    [t],
  );

  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById("main-scroll-container");
      if (!container) return;
      const scrollPosition = container.scrollTop + 150;
      let currentSectionId = activeSection;

      for (const group of menuGroups) {
        const el = document.getElementById(group.id);
        if (el && el.offsetTop <= scrollPosition) {
          currentSectionId = group.id;
        }
      }

      if (currentSectionId !== activeSection) {
        setActiveSection(currentSectionId);
      }
    };

    const container = document.getElementById("main-scroll-container");
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [activeSection, menuGroups]);

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

  const members = dashboard?.members ?? [];
  const membersWithScoreboard = members.filter(
    (member) => member.hasScoreboard,
  );

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (hasNoWorkspace || !dashboard) {
    return <DashboardNoWorkspaceState />;
  }

  if (membersWithScoreboard.length === 0) {
    return <DashboardNoScoreboardState />;
  }

  const currentUserRole =
    members.find((member) => member.userId === myUserId)?.role ?? null;

  return (
    <div className="min-h-screen bg-zinc-100">
      <ProtectedPageContainer
        className={cn(
          "relative transition-[left] duration-300 ease-out xl:origin-top space-y-6 lg:space-y-12",
          activeMemoState ? "xl:left-[-112px]" : "xl:left-0",
        )}
      >
        <ProtectedPageHeader
          title={t("teamStatus")}
          rightElement={
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="h-6 w-24 animate-pulse rounded-full bg-zinc-100" />
              ) : (
                <PeriodBadge label={weekLabel} size="md" />
              )}
            </div>
          }
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          <PageSidebarNav
            items={menuGroups.map((group) => ({ id: group.id, label: group.label }))}
            activeId={activeSection}
          />

          {/* ── 우측 메인 콘텐츠 ── */}
          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-[60vh]">
            <section id="summary" className="space-y-5 scroll-mt-28">
              <SectionHeader title={t("memberSummary")} />

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-28 w-full animate-pulse rounded-content bg-zinc-50"
                    />
                  ))}
                </div>
              ) : members.length === 0 ? (
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

            <section
              id="scoreboard"
              className="space-y-6 overflow-visible scroll-mt-28"
            >
              <SectionHeader
                title={t("teamWeeklyScoreboard")}
                description={t("teamWeeklyScoreboardDesc")}
              />
              <TeamPeriodControls
                isPeriodLoading={isPeriodLoading}
                isPreviousDisabled={isPreviousDisabled}
                isResetVisible={isResetVisible}
                movePeriod={movePeriod}
                resetToToday={resetToToday}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                weekLabel={weekLabel}
              />

              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-64 w-full animate-pulse rounded-content bg-zinc-50"
                    />
                  ))}
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
      </ProtectedPageContainer>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-[1200px] mx-auto p-4 md:p-10 lg:p-12 space-y-10 animate-pulse">
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
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-[1200px] mx-auto flex min-h-screen items-center p-4 md:p-10 lg:p-12">
        <EmptyStatePanel
          icon={<Logo size="20px" className="text-primary" />}
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
  const workspaceId = useParams().workspaceId as string;
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-[1200px] mx-auto flex min-h-screen items-center p-4 md:p-10 lg:p-12">
        <EmptyStatePanel
          icon={<Logo size="20px" className="text-primary" />}
          title={t("noScoreboardTitle")}
          description={t("noScoreboardDesc")}
          actions={
            <Button
              asChild
              className="btn-dowin-primary flex items-center gap-2 w-fit px-5 py-3 text-sm rounded-button"
            >
              <Link href={`/${workspaceId}/setup?mode=create`}>{t("createScoreboard")}</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
