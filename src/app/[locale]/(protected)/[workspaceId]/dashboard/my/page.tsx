"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import { WorkspaceOverLimitBanner } from "@/app/[locale]/(protected)/_components/WorkspaceOverLimitBanner";
import { MonthlyBoardSection } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/MonthlyBoardSection";
import { PeriodControls } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/PeriodControls";
import { ProductUpdateCard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/ProductUpdateCard";
import { ScoreboardOverviewSection } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/ScoreboardOverviewSection";
import { WeeklyBoardSection } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/WeeklyBoardSection";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useDashboardScoreboard";
import { useLoginPushPrompt } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useLoginPushPrompt";
import { useMyDashboardPageState } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_hooks/useMyDashboardPageState";
import { type CelebrationLevel } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-celebration";
import { getMonthCalendarWeeks } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useToast } from "@/context/ToastContext";
import { Link } from "@/i18n/routing";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { PageSidebarNav } from "@/components/PageSidebarNav";

export default function MyDashboardPage() {
  const t = useTranslations("Dashboard");
  const { showToast } = useToast();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const {
    activeLeadMeasures,
    activeScoreboard,
    hasNoScoreboard,
    hasNoWorkspace,
    isLoading,
    isLogPending,
    isWeeklyTrendLoading,
    monthlyLeadMeasures,
    monthlyOverallRate,
    monthlySummary,
    monthLabel,
    movePeriod,
    pendingLogKeys,
    resetToToday,
    selectedDate,
    selectedView,
    setSelectedDate,
    setSelectedView,
    today,
    toggleLog,
    weekDates,
    weeklyGuideById,
    weekLabel,
    weeklyTrendPoints,
    weeklyOverallRate,
    weeklyById,
    workspace,
    isPreviousDisabled,
    isPeriodLoading,
    // isPreviousTrendLoading,
  } = useDashboardScoreboard(workspaceId);
  const { data: profileResponse, isLoading: isProfileLoading } = useGetUsersMe({
    query: {
      retry: false,
    },
  });
  const nickname =
    profileResponse?.status === 200
      ? (profileResponse.data.nickname ?? null)
      : null;
  const isWorkspaceAdmin =
    profileResponse?.status === 200 && profileResponse.data.role === "ADMIN";
  const {
    celebrationLevel,
    handleDismissProductUpdate,
    isUpdateCardVisible,
    latestMajorUpdate,
    markCelebrationPending,
  } = useMyDashboardPageState({
    activeLeadMeasures,
    isLogPending,
    selectedView,
    showToast,
    weeklyById,
  });
  const monthWeeks = getMonthCalendarWeeks(selectedDate);
  const lastTrackedViewRef = useRef<string | null>(null);

  useLoginPushPrompt();

  const [activeSection, setActiveSection] = useState("overview");

  const menuGroups = useMemo(
    () => [
      { id: "overview", label: t("recentTrend") },
      { id: "scoreboard", label: t("executionBoard") },
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
    if (isLoading || isProfileLoading) {
      return;
    }

    if (lastTrackedViewRef.current === selectedView) {
      return;
    }

    trackEvent("dashboard_my_viewed", {
      has_active_scoreboard: Boolean(activeScoreboard),
      scoreboard_id_hash: hashId(activeScoreboard?.id),
      view_type: selectedView,
      workspace_id_hash: hashId(workspace?.id),
    });
    lastTrackedViewRef.current = selectedView;
  }, [
    activeScoreboard,
    isLoading,
    isProfileLoading,
    selectedView,
    workspace?.id,
  ]);

  if (isLoading) {
    return <MyDashboardSkeleton />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (hasNoScoreboard || !activeScoreboard) {
    return <NoScoreboardState />;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      {celebrationLevel ? (
        <DashboardCelebrationOverlay level={celebrationLevel} />
      ) : null}
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader
          title={
            isProfileLoading ? (
              <div className="h-8 w-48 animate-pulse rounded-content bg-zinc-200" />
            ) : nickname ? (
              t("userScoreboard", { nickname })
            ) : (
              t("myScoreboard")
            )
          }
          rightElement={
            <div className="flex flex-wrap gap-2">
              <Button asChild className="h-10 px-4 text-[13px] font-black rounded-[16px] bg-white text-zinc-900 hover:bg-zinc-50 transition-all active:scale-95">
                <Link href={`/${workspaceId}/scoreboards`}>
                  <DowinIcon name="nav-archive" size="16px" className="mr-1.5 text-zinc-500" />
                  {t("scoreboardArchive")}
                </Link>
              </Button>
              <Button asChild className="h-10 px-4 text-[13px] font-black rounded-[16px] bg-white text-zinc-900 hover:bg-zinc-50 transition-all active:scale-95">
                <Link href={`/${workspaceId}/setup?mode=update`}>
                  <DowinIcon name="action-edit" size="16px" className="mr-1.5 text-zinc-500" />
                  {t("manageScoreboard")}
                </Link>
              </Button>
            </div>
          }
        />

        {workspace?.isOverFreeMemberLimit ? (
          <WorkspaceOverLimitBanner
            freeMemberLimit={workspace.freeMemberLimit}
            isAdmin={isWorkspaceAdmin}
            memberCount={workspace.memberCount}
          />
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12 items-start">
          <PageSidebarNav
            items={menuGroups.map((group) => ({ id: group.id, label: group.label }))}
            activeId={activeSection}
          />

          {/* ── 우측 메인 콘텐츠 ── */}
          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-48">
            <section id="overview" className="space-y-4 scroll-mt-28">
              <h2 className="px-1 text-[22px] font-bold tracking-tight text-zinc-900">{t("recentTrend")}</h2>
              <ScoreboardOverviewSection
                activeScoreboard={activeScoreboard}
                isWeeklyTrendLoading={isWeeklyTrendLoading}
                monthlyOverallRate={monthlyOverallRate}
                weeklyOverallRate={weeklyOverallRate}
                weeklyTrendPoints={weeklyTrendPoints}
              />
            </section>

            {latestMajorUpdate && isUpdateCardVisible ? (
              <ProductUpdateCard
                update={latestMajorUpdate}
                onDismiss={handleDismissProductUpdate}
              />
            ) : null}

            <section id="scoreboard" className="space-y-4 scroll-mt-28">
              <h2 className="px-1 text-[22px] font-bold tracking-tight text-zinc-900">{t("executionBoard")}</h2>
              <PeriodControls
                monthLabel={monthLabel}
                movePeriod={movePeriod}
                resetToToday={resetToToday}
                selectedDate={selectedDate}
                selectedView={selectedView}
                setSelectedDate={setSelectedDate}
                setSelectedView={setSelectedView}
                weekLabel={weekLabel}
                today={today}
                isPreviousDisabled={isPreviousDisabled}
                isPeriodLoading={isPeriodLoading}
              />

              {isLoading ? (
                <div className="h-[400px] w-full animate-pulse rounded-content bg-zinc-200" />
              ) : activeLeadMeasures.length === 0 ? (
                <div className="rounded-[24px] bg-white py-12 text-center text-zinc-500 font-medium text-[15px]">
                  {t("noActiveMeasures")}
                </div>
              ) : selectedView === "month" ? (
                <MonthlyBoardSection
                  activeLeadMeasures={activeLeadMeasures}
                  monthLabel={monthLabel}
                  monthWeeks={monthWeeks}
                  monthlyLeadMeasures={monthlyLeadMeasures}
                  monthlyOverallRate={monthlyOverallRate}
                  monthlySummary={monthlySummary}
                  today={today}
                />
              ) : (
                <WeeklyBoardSection
                  activeLeadMeasures={activeLeadMeasures}
                  onBeforeToggle={markCelebrationPending}
                  pendingLogKeys={pendingLogKeys}
                  today={today}
                  toggleLog={toggleLog}
                  weekDates={weekDates}
                  weeklyGuideById={weeklyGuideById}
                  weeklyById={weeklyById}
                />
              )}
            </section>
          </div>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function DashboardCelebrationOverlay({ level }: { level: CelebrationLevel }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-64 animate-dashboard-celebration-flash ${
          level === "all" ? "opacity-100" : "opacity-80"
        }`}
      />
    </div>
  );
}

function MyDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-[1200px] mx-auto p-4 md:p-10 lg:p-12 space-y-10 animate-pulse">
        <div className="h-16 rounded-content bg-zinc-200" />
        <div className="h-24 rounded-content bg-zinc-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-48 rounded-content bg-zinc-200" />
          <div className="h-48 rounded-content bg-zinc-200" />
        </div>
        <div className="h-72 rounded-content bg-zinc-200" />
      </div>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("Dashboard");
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-[1200px] mx-auto flex min-h-screen items-center p-4 md:p-10 lg:p-12">
        <EmptyStatePanel
          icon={<Logo size="20px" className="text-primary" />}
          title={t("noWorkspaceTitle")}
          description={
            <div className="whitespace-pre-line">{t("noWorkspaceDesc")}</div>
          }
          actions={<NoWorkspaceActions />}
        />
      </div>
    </div>
  );
}

function NoScoreboardState() {
  const t = useTranslations("Dashboard");
  const workspaceId = useParams().workspaceId as string;
  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-[1200px] mx-auto flex min-h-screen items-center p-4 md:p-10 lg:p-12">
        <EmptyStatePanel
          title={t("noScoreboardTitle")}
          description={
            <div className="whitespace-pre-line">{t("noScoreboardDesc")}</div>
          }
          actions={
            <Button
              asChild
              className="h-[56px] w-full flex items-center justify-center px-8 text-[16px] font-black rounded-[24px] bg-zinc-900 text-white hover:bg-zinc-800 transition-colors active:scale-[0.98]"
            >
              <Link href={`/${workspaceId}/setup?mode=create`}>{t("createScoreboard")}</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
