"use client";

import type { getWorkspacesWorkspaceIdDashboardMyResponse } from "@/api/generated/dashboard/dashboard";
import type { getUsersMeResponse } from "@/api/generated/profile/profile";
import { useGetUsersMe } from "@/api/generated/profile/profile";
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
import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { WorkspaceOverLimitBanner } from "@/app/[locale]/(protected)/_components/WorkspaceOverLimitBanner";
import { PageSidebarNav } from "@/components/PageSidebarNav";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useToast } from "@/context/ToastContext";
import { useActiveSectionScroll } from "@/hooks/useActiveSectionScroll";
import { Link } from "@/i18n/routing";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { isWorkspaceAdminRole } from "@/lib/client/workspace-role";
import { Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";

const TeamMemberCheckIn = dynamic(
  () =>
    import(
      "@/app/[locale]/(protected)/[workspaceId]/dashboard/_components/TeamMemberCheckIn"
    ).then((mod) => mod.TeamMemberCheckIn),
  { ssr: false },
);

export type DashboardMyClientProps = {
  initialProfile: getUsersMeResponse | undefined;
  initialDashboard: getWorkspacesWorkspaceIdDashboardMyResponse | undefined;
};

export function DashboardMyClient({ initialProfile, initialDashboard }: DashboardMyClientProps) {
  const t = useTranslations("Dashboard");
  const { showToast } = useToast();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const {
    activeLeadMeasures,
    activeScoreboard,
    currentCheckinStreak,
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
  } = useDashboardScoreboard(workspaceId, initialDashboard);
  const { data: profileResponse, isLoading: isProfileLoading } = useGetUsersMe({
    query: {
      initialData: initialProfile,
      retry: false,
    },
  });
  const nickname = profileResponse?.status === 200 ? (profileResponse.data.nickname ?? null) : null;
  const isWorkspaceAdmin = isWorkspaceAdminRole(workspace);
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

  const menuGroups = useMemo(
    () => [
      { id: "overview", label: t("recentTrend") },
      { id: "scoreboard", label: t("executionBoard") },
    ],
    [t],
  );

  const [activeSection] = useActiveSectionScroll(menuGroups, "overview");

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
  }, [activeScoreboard, isLoading, isProfileLoading, selectedView, workspace?.id]);

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
    <div className="min-h-screen">
      <TeamMemberCheckIn />
      {celebrationLevel ? <DashboardCelebrationOverlay level={celebrationLevel} /> : null}
      <ProtectedPageContainer className="space-y-6 lg:space-y-12">
        <ProtectedPageHeader
          title={
            <div className="flex items-center gap-3">
              {isProfileLoading ? (
                <div className="h-8 w-48 animate-pulse rounded-[12px] bg-border" />
              ) : (
                <span>{nickname ? t("userScoreboard", { nickname }) : t("myScoreboard")}</span>
              )}

              {currentCheckinStreak > 0 ? (
                <Badge
                  variant="primary"
                  shape="pill"
                  size="lg"
                  className="gap-1 text-[13px] px-3 border-primary/10"
                  title={t("dailyCheckinStreakTitle", { count: currentCheckinStreak })}
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{t("dailyCheckinStreak", { count: currentCheckinStreak })}</span>
                </Badge>
              ) : null}
            </div>
          }
          rightElement={
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-black !rounded-2xl bg-surface text-text-primary"
              >
                <Link href={`/${workspaceId}/scoreboards`}>{t("scoreboardArchive")}</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-black !rounded-2xl bg-surface text-text-primary"
              >
                <Link href={`/${workspaceId}/setup?mode=update`}>{t("manageScoreboard")}</Link>
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
            items={menuGroups.map((group) => ({
              id: group.id,
              label: group.label,
            }))}
            activeId={activeSection}
          />

          {/* ── 우측 메인 콘텐츠 ── */}
          <div className="w-full flex-1 space-y-8 lg:max-w-[800px] lg:space-y-12 pb-24 lg:pb-48">
            <section id="overview" className="space-y-4 scroll-mt-28">
              <SectionHeader title={t("recentTrend")} />
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
              <SectionHeader
                title={t("executionBoard")}
                rightElement={
                  <SegmentedControl
                    options={[
                      { value: "week", label: t("weekView") },
                      { value: "month", label: t("monthView") },
                    ]}
                    value={selectedView}
                    onChange={setSelectedView}
                    disabled={isPeriodLoading}
                    size="sm"
                  />
                }
              />
              <PeriodControls
                monthLabel={monthLabel}
                movePeriod={movePeriod}
                resetToToday={resetToToday}
                selectedDate={selectedDate}
                selectedView={selectedView}
                setSelectedDate={setSelectedDate}
                weekLabel={weekLabel}
                today={today}
                isPreviousDisabled={isPreviousDisabled}
                isPeriodLoading={isPeriodLoading}
              />

              {isLoading ? (
                <div className="h-[400px] w-full animate-pulse rounded-[24px] bg-border" />
              ) : activeLeadMeasures.length === 0 ? (
                <div className="rounded-[24px] bg-surface py-12 text-center text-text-muted font-medium text-[15px]">
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
                  isLoading={isPeriodLoading}
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
                  allowPastDailyLogEdit={workspace?.allowPastDailyLogEdit}
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

export function MyDashboardSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1200px] mx-auto p-4 md:p-10 lg:p-12 space-y-10 animate-pulse">
        <div className="h-12 w-1/3 rounded-[12px] bg-border" />
        <div className="h-[140px] rounded-[24px] bg-border" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-48 rounded-[24px] bg-border" />
          <div className="h-48 rounded-[24px] bg-border" />
        </div>
        <div className="h-[400px] rounded-[24px] bg-border" />
      </div>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("Dashboard");
  return (
    <div className="min-h-screen">
      <div className="max-w-[1200px] mx-auto flex min-h-screen items-center p-4 md:p-10 lg:p-12">
        <EmptyStatePanel
          icon={<Logo size="20px" className="text-primary" />}
          title={t("noWorkspaceTitle")}
          description={<div className="whitespace-pre-line">{t("noWorkspaceDesc")}</div>}
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
    <div className="min-h-screen">
      <div className="max-w-[1200px] mx-auto flex min-h-screen items-center p-4 md:p-10 lg:p-12">
        <EmptyStatePanel
          title={t("noScoreboardTitle")}
          description={t("noScoreboardDesc")}
          actions={
            <Button asChild variant="hero" size="hero" className="w-full">
              <Link href={`/${workspaceId}/setup?mode=create`}>{t("createScoreboard")}</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
