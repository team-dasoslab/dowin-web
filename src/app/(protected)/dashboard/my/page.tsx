"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { EmptyStatePanel } from "@/app/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/(protected)/_components/NoWorkspaceActions";
import { DashboardHeader } from "@/app/(protected)/dashboard/my/_components/DashboardHeader";
import { MonthlyBoardSection } from "@/app/(protected)/dashboard/my/_components/MonthlyBoardSection";
import { PeriodControls } from "@/app/(protected)/dashboard/my/_components/PeriodControls";
import { ProductUpdateCard } from "@/app/(protected)/dashboard/my/_components/ProductUpdateCard";
import { ScoreboardOverviewSection } from "@/app/(protected)/dashboard/my/_components/ScoreboardOverviewSection";
import { WeeklyBoardSection } from "@/app/(protected)/dashboard/my/_components/WeeklyBoardSection";
import { useDashboardScoreboard } from "@/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { useMyDashboardPageState } from "@/app/(protected)/dashboard/my/_hooks/useMyDashboardPageState";
import { type CelebrationLevel } from "@/app/(protected)/dashboard/my/_lib/dashboard-celebration";
import { MY_DASHBOARD_LINKS } from "@/app/(protected)/dashboard/my/_lib/dashboard-links";
import { getMonthCalendarWeeks } from "@/app/(protected)/dashboard/my/_lib/week";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { trackEvent } from "@/lib/client/gtag";
import { Plus, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function MyDashboardPage() {
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
      view_type: selectedView,
    });
    lastTrackedViewRef.current = selectedView;
  }, [activeScoreboard, isLoading, isProfileLoading, selectedView]);

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

        <ScoreboardOverviewSection
          activeScoreboard={activeScoreboard}
          isWeeklyTrendLoading={isWeeklyTrendLoading}
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
          />

          {activeLeadMeasures.length === 0 ? (
            <div className="border border-border rounded-lg p-8 text-center text-text-muted text-sm">
              활성화된 선행지표가 없습니다.
            </div>
          ) : selectedView === "month" ? (
            <MonthlyBoardSection
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
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-10 animate-linear-in">
        <MyDashboardEmptyHeader variant="no-workspace" />
        <EmptyStatePanel
          title="소속된 워크스페이스가 없어요"
          description={
            <>
              팀원들과 함께 목표를 공유하고 성장하기 위해
              <br />
              새로운 워크스페이스를 만들거나 초대받으세요.
            </>
          }
          actions={<NoWorkspaceActions />}
        />
      </div>
    </div>
  );
}

function NoScoreboardState() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-10 animate-linear-in">
        <MyDashboardEmptyHeader variant="no-scoreboard" />

        <EmptyStatePanel
          title="아직 목표가 없어요"
          description={
            <>
              가장 중요한 단 하나의 목표, 가중목을 설정하고
              <br />
              매일의 성장을 기록하기 시작하세요.
            </>
          }
          actions={
            <Button
              asChild
              className="btn-linear-primary flex items-center gap-2 w-fit px-5 py-3 text-sm"
            >
              <Link href="/setup?mode=create">
                <Plus className="w-4 h-4" />새 점수판 만들기
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
                가장 중요한 목표에 집중하세요.
              </p>
            </div>
          </>
        ) : (
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted truncate">대시보드</p>
            <h1 className="text-sm font-bold text-text-primary truncate">
              나의 점수판
            </h1>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {links.map(({ href, icon: Icon, label }) => (
          <Button
            key={href}
            asChild
            className="flex-1 sm:flex-none justify-center px-3 py-2 bg-white border border-border rounded-lg text-xs font-bold text-text-primary hover:border-[rgba(205,207,213,1)] transition-colors flex items-center gap-1.5 min-w-fit"
          >
            <Link href={href}>
              <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>{label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </header>
  );
}
