"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import { WorkspaceOverLimitBanner } from "@/app/[locale]/(protected)/_components/WorkspaceOverLimitBanner";
import { DashboardHeader } from "@/app/[locale]/(protected)/dashboard/my/_components/DashboardHeader";
import { HistoryLimitOverlay } from "@/app/[locale]/(protected)/dashboard/my/_components/HistoryLimitOverlay";
import { MonthlyBoardSection } from "@/app/[locale]/(protected)/dashboard/my/_components/MonthlyBoardSection";
import { PeriodControls } from "@/app/[locale]/(protected)/dashboard/my/_components/PeriodControls";
import { ProductUpdateCard } from "@/app/[locale]/(protected)/dashboard/my/_components/ProductUpdateCard";
import { ScoreboardOverviewSection } from "@/app/[locale]/(protected)/dashboard/my/_components/ScoreboardOverviewSection";
import { WeeklyBoardSection } from "@/app/[locale]/(protected)/dashboard/my/_components/WeeklyBoardSection";
import { useDashboardScoreboard } from "@/app/[locale]/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { useMyDashboardPageState } from "@/app/[locale]/(protected)/dashboard/my/_hooks/useMyDashboardPageState";
import { type CelebrationLevel } from "@/app/[locale]/(protected)/dashboard/my/_lib/dashboard-celebration";
import { MY_DASHBOARD_LINKS } from "@/app/[locale]/(protected)/dashboard/my/_lib/dashboard-links";
import { getMonthCalendarWeeks } from "@/app/[locale]/(protected)/dashboard/my/_lib/week";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { Link } from "@/i18n/routing";
import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { Plus, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export default function MyDashboardPage() {
  const t = useTranslations("Dashboard");
  const { showToast } = useToast();
  const {
    activeLeadMeasures,
    activeScoreboard,
    hasNoScoreboard,
    hasNoWorkspace,
    isLoading,
    isLogPending,
    isMonthlyLogsLoading,
    isWeeklyTrendLoading,
    isWeeklyLogsLoading,
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
    historyLimitDate,
    isPreviousDisabled,
    isPeriodLoading,
    isHistoryLimited,
    isTrendLimited,
  } = useDashboardScoreboard();
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
  const weeklyGoalCount = activeLeadMeasures.filter(
    (leadMeasure) => leadMeasure.period === "WEEKLY",
  ).length;
  const monthlyGoalCount = activeLeadMeasures.filter(
    (leadMeasure) => leadMeasure.period === "MONTHLY",
  ).length;
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

  if (
    isLoading ||
    isProfileLoading ||
    (activeScoreboard &&
      ((selectedView === "week" && isWeeklyLogsLoading) ||
        (selectedView === "month" && isMonthlyLogsLoading)) &&
      weeklyById.size === 0)
  ) {
    return <MyDashboardSkeleton />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (hasNoScoreboard || !activeScoreboard) {
    return <NoScoreboardState />;
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      {celebrationLevel ? (
        <DashboardCelebrationOverlay level={celebrationLevel} />
      ) : null}
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        <DashboardHeader nickname={nickname} workspaceName={workspace?.name} />

        {workspace?.isOverFreeMemberLimit ? (
          <WorkspaceOverLimitBanner
            freeMemberLimit={workspace.freeMemberLimit}
            isAdmin={isWorkspaceAdmin}
            memberCount={workspace.memberCount}
          />
        ) : null}

        <ScoreboardOverviewSection
          activeScoreboard={activeScoreboard}
          isWeeklyTrendLoading={isWeeklyTrendLoading}
          isTrendLimited={isTrendLimited}
          monthLabel={monthLabel}
          monthlyOverallRate={monthlyOverallRate}
          weeklyOverallRate={weeklyOverallRate}
          weeklyTrendPoints={weeklyTrendPoints}
        />

        {latestMajorUpdate && isUpdateCardVisible ? (
          <ProductUpdateCard
            update={latestMajorUpdate}
            onDismiss={handleDismissProductUpdate}
          />
        ) : null}

        <section className="space-y-3">
          <PeriodControls
            monthLabel={monthLabel}
            monthlyGoalCount={monthlyGoalCount}
            movePeriod={movePeriod}
            resetToToday={resetToToday}
            selectedDate={selectedDate}
            selectedView={selectedView}
            setSelectedDate={setSelectedDate}
            setSelectedView={setSelectedView}
            weekLabel={weekLabel}
            weeklyGoalCount={weeklyGoalCount}
            historyLimitDate={historyLimitDate}
            isPreviousDisabled={isPreviousDisabled}
            isPeriodLoading={isPeriodLoading}
          />

          <HistoryLimitOverlay isLimited={isHistoryLimited}>
            {activeLeadMeasures.length === 0 ? (
              <div className="border border-border rounded-lg p-8 text-center text-text-muted text-sm">
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
          </HistoryLimitOverlay>
        </section>
      </div>
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
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-16 rounded-2xl bg-sub-background" />
        <div className="h-24 rounded-2xl bg-sub-background" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-48 rounded-2xl bg-sub-background" />
          <div className="h-48 rounded-2xl bg-sub-background" />
        </div>
        <div className="h-72 rounded-2xl bg-sub-background" />
      </div>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("Dashboard");
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-10 animate-linear-in">
        <MyDashboardEmptyHeader variant="no-workspace" />
        <EmptyStatePanel
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
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-10 animate-linear-in">
        <MyDashboardEmptyHeader variant="no-scoreboard" />

        <EmptyStatePanel
          title={t("noScoreboardTitle")}
          description={
            <div className="whitespace-pre-line">{t("noScoreboardDesc")}</div>
          }
          actions={
            <Button
              asChild
              className="btn-linear-primary flex items-center gap-2 w-fit px-5 py-3 text-sm"
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

function MyDashboardEmptyHeader({
  variant,
}: {
  variant: "no-workspace" | "no-scoreboard";
}) {
  const t = useTranslations("Dashboard");
  const links =
    variant === "no-workspace"
      ? MY_DASHBOARD_LINKS.filter(({ href }) => href === "/profile")
      : MY_DASHBOARD_LINKS.filter(({ href }) => href !== "/setup?mode=update");

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {variant === "no-workspace" ? (
          <>
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 text-primary shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-text-primary truncate">
                WIG
              </h1>
              <p className="text-[11px] text-text-muted truncate">
                {t("wigSlogan")}
              </p>
            </div>
          </>
        ) : (
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted truncate">
              {t("myDashboard")}
            </p>
            <h1 className="text-sm font-bold text-text-primary truncate">
              {t("myScoreboard")}
            </h1>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {links.map(({ href, icon: Icon, translationKey }) => (
          <Button
            key={href}
            asChild
            className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
          >
            <Link href={href}>
              <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>{t(translationKey)}</span>
            </Link>
          </Button>
        ))}
      </div>
    </header>
  );
}
