"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { MonthlyMobileCards } from "@/app/(protected)/dashboard/my/_components/MonthlyMobileCards";
import { WeeklyMobileCards } from "@/app/(protected)/dashboard/my/_components/WeeklyMobileCards";
import { useDashboardScoreboard } from "@/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard";
import { EmptyStatePanel } from "@/app/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/(protected)/_components/NoWorkspaceActions";
import {
  canPlayCelebration,
  fireDashboardConfetti,
  getCelebrationToastMessage,
  getNextCelebrationEvent,
  type CelebrationLevel,
  type WeeklyCelebrationSnapshot,
} from "@/app/(protected)/dashboard/my/_lib/dashboard-celebration";
import {
  DAY_LABELS,
  getMonthCalendarWeeks,
} from "@/app/(protected)/dashboard/my/_lib/week";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";
import { toNumberId } from "@/lib/client/frontend-api";
import {
  dismissProductUpdate,
  getLatestMajorProductUpdate,
  isProductUpdateDismissed,
  readDismissedProductUpdate,
} from "@/lib/product-updates";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderArchive,
  Plus,
  Settings,
  Target,
  User as UserIcon,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const DASHBOARD_LINKS: {
  href: string;
  icon: LucideIcon;
  label: string;
}[] = [
  { href: "/dashboard", icon: Users, label: "팀 대시보드" },
  { href: "/scoreboards", icon: FolderArchive, label: "점수판 보관함" },
  { href: "/setup?mode=update", icon: Settings, label: "점수판 관리" },
  { href: "/profile", icon: UserIcon, label: "내 프로필" },
];

export default function MyDashboardPage() {
  const [isUpdateCardVisible, setIsUpdateCardVisible] = useState(false);
  const [celebrationEvent, setCelebrationEvent] = useState<{
    id: number;
    level: CelebrationLevel;
  } | null>(null);
  const previousWeeklySnapshotRef = useRef<WeeklyCelebrationSnapshot | null>(
    null,
  );
  const previousCompletedMeasureIdsRef = useRef<Set<number>>(new Set());
  const celebrationWatchRef = useRef(false);
  const { showToast } = useToast();
  const {
    activeLeadMeasures,
    activeScoreboard,
    hasNoScoreboard,
    hasNoWorkspace,
    isLoading,
    isLogPending,
    isMonthlyLogsLoading,
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
    weekLabel,
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
    profileResponse?.status === 200 ? profileResponse.data.nickname : null;
  const weeklyGoalCount = activeLeadMeasures.filter(
    (leadMeasure) => leadMeasure.period === "WEEKLY",
  ).length;
  const monthlyGoalCount = activeLeadMeasures.filter(
    (leadMeasure) => leadMeasure.period === "MONTHLY",
  ).length;
  const weeklyCelebrationSnapshot = getWeeklyCelebrationSnapshot(
    activeLeadMeasures,
    weeklyById,
  );
  const monthWeeks = getMonthCalendarWeeks(selectedDate);
  const latestMajorUpdate = getLatestMajorProductUpdate();

  useEffect(() => {
    if (!latestMajorUpdate) {
      setIsUpdateCardVisible(false);
      return;
    }

    const dismissed = readDismissedProductUpdate();
    setIsUpdateCardVisible(
      !isProductUpdateDismissed(latestMajorUpdate.id, dismissed),
    );
  }, [latestMajorUpdate]);

  useEffect(() => {
    const previousSnapshot = previousWeeklySnapshotRef.current;
    const previousCompletedMeasureIds = previousCompletedMeasureIdsRef.current;
    previousWeeklySnapshotRef.current = weeklyCelebrationSnapshot;
    previousCompletedMeasureIdsRef.current = getCompletedWeeklyMeasureIds(
      activeLeadMeasures,
      weeklyById,
    );

    if (
      previousSnapshot === null ||
      selectedView !== "week" ||
      !celebrationWatchRef.current
    ) {
      return;
    }

    if (
      weeklyCelebrationSnapshot.totalCount === 0 ||
      weeklyCelebrationSnapshot.completedCount <=
        previousSnapshot.completedCount
    ) {
      if (!isLogPending) {
        celebrationWatchRef.current = false;
      }
      return;
    }

    celebrationWatchRef.current = false;

    setCelebrationEvent(
      getNextCelebrationEvent({
        activeLeadMeasures,
        nextSnapshot: weeklyCelebrationSnapshot,
        previousSnapshot,
        previousCompletedMeasureIds,
        weeklyById,
      }),
    );
  }, [
    activeLeadMeasures,
    isLogPending,
    selectedView,
    weeklyById,
    weeklyCelebrationSnapshot,
  ]);

  useEffect(() => {
    if (!canPlayCelebration(celebrationEvent, isLogPending)) {
      return;
    }

    void fireDashboardConfetti(celebrationEvent.level);

    showToast("success", getCelebrationToastMessage(celebrationEvent));

    const timeout = window.setTimeout(() => {
      setCelebrationEvent((current) =>
        current?.id === celebrationEvent.id ? null : current,
      );
    }, 2800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [celebrationEvent, isLogPending, showToast]);

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
      {canPlayCelebration(celebrationEvent, isLogPending) ? (
        <DashboardCelebrationOverlay level={celebrationEvent.level} />
      ) : null}
      <div className="max-w-[860px] mx-auto p-4 md:p-8 space-y-8 animate-linear-in">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-text-muted truncate">
                {workspace?.name}
              </p>
              <h1 className="text-sm font-bold text-text-primary truncate">
                {nickname ? `${nickname}님의 점수판` : "나의 점수판"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {DASHBOARD_LINKS.map(({ href, icon: Icon, label }) => (
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

        <Card className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-row items-center gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  가중목
                </p>
                <h2 className="text-lg font-bold text-text-primary">
                  {activeScoreboard.goalName}
                </h2>
              </div>
            </div>

            <div className="space-y-1 text-left sm:text-right">
              <p className="text-[10px] text-text-muted">이번 주 달성률</p>
              <p
                className={`text-2xl font-bold font-mono tracking-tight ${
                  weeklyOverallRate >= 80
                    ? "text-green-600"
                    : weeklyOverallRate >= 50
                      ? "text-amber-600"
                      : "text-text-primary"
                }`}
              >
                {weeklyOverallRate}%
              </p>
              <div className="flex flex-wrap items-center gap-1 text-[10px] text-text-muted sm:justify-end">
                <span>
                  이번 달 달성률{monthLabel ? ` (${monthLabel})` : ""}
                </span>
                <strong
                  className={`font-mono ${
                    monthlyOverallRate >= 80
                      ? "text-green-600"
                      : monthlyOverallRate >= 50
                        ? "text-amber-600"
                        : "text-text-primary"
                  }`}
                >
                  {monthlyOverallRate}%
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-sub-background px-4 py-3 sm:px-6 sm:items-center">
            <Target className="w-3.5 h-3.5 text-text-muted" />
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center">
              <span className="text-[10px] font-bold text-text-muted tracking-widest sm:mr-3">
                후행지표
              </span>
              <span className="text-sm text-text-primary font-medium break-words">
                {activeScoreboard.lagMeasure}
              </span>
            </div>
          </div>
        </Card>

        {latestMajorUpdate && isUpdateCardVisible ? (
          <Card className="overflow-hidden rounded-lg border border-border">
            <div className="relative bg-[linear-gradient(135deg,rgba(49,81,255,0.10),rgba(255,255,255,0.96)_55%,rgba(49,81,255,0.04))] px-4 py-4 sm:px-5">
              <Button
                type="button"
                onClick={() => {
                  dismissProductUpdate(latestMajorUpdate.id);
                  setIsUpdateCardVisible(false);
                }}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md border border-white/70 bg-white/80 text-text-muted hover:text-text-primary"
                aria-label="이 업데이트 잠시 숨기기"
              >
                <X className="h-3.5 w-3.5" />
              </Button>

              <div className="space-y-2.5 pr-10 sm:max-w-[84%] sm:pr-0">
                <div>
                  <span className="inline-flex w-fit rounded-md border border-primary/15 bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    새로운 기능 안내
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold tracking-tight text-text-primary">
                    {latestMajorUpdate.title}
                  </h2>
                  <p className="max-w-[520px] text-[13px] leading-5 text-text-secondary">
                    {latestMajorUpdate.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] leading-none text-text-muted">
                  <Calendar className="h-3 w-3" />
                  <span>{latestMajorUpdate.publishedAt}</span>
                  <span className="text-border">•</span>
                  <span>{latestMajorUpdate.tag}</span>
                </div>

                <div className="flex flex-row flex-wrap items-center gap-2 pt-0.5">
                  <Button
                    asChild
                    className="justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90"
                  >
                    <Link href={latestMajorUpdate.ctaHref}>
                      {latestMajorUpdate.ctaLabel}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="justify-center rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary"
                  >
                    <Link href="/updates">새 기능 모아보기</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        <section className="space-y-3">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex w-fit rounded-lg border border-border bg-sub-background p-1">
                {(["week", "month"] as const).map((view) => {
                  const isActive = selectedView === view;

                  return (
                    <Button
                      key={view}
                      type="button"
                      onClick={() => setSelectedView(view)}
                      className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-white text-primary shadow-sm"
                          : "text-text-secondary"
                      }`}
                    >
                      {view === "week" ? "주간" : "월간"}
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 sm:flex sm:items-center">
                  <Button
                    type="button"
                    onClick={() => movePeriod(-1)}
                    className="h-9 w-9 rounded-lg border border-border bg-white text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary"
                  >
                    <ChevronLeft className="mx-auto h-4 w-4" />
                  </Button>
                  <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs text-text-secondary">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent font-mono text-text-primary outline-none"
                    />
                  </label>
                  <Button
                    type="button"
                    onClick={() => movePeriod(1)}
                    className="h-9 w-9 rounded-lg border border-border bg-white text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-text-primary"
                  >
                    <ChevronRight className="mx-auto h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={resetToToday}
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-xs font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-primary sm:w-auto"
                >
                  오늘로 돌아가기
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-text-muted">
              {selectedView === "week"
                ? "선택한 날짜가 포함된 한 주(월~일)를 보여줍니다."
                : "선택한 날짜가 포함된 한 달 전체를 집계합니다."}
            </p>
          </div>

          <div className="flex flex-col gap-3 px-0.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-text-primary">
                {selectedView === "week" ? "주간 선행지표" : "월간 집계"}
              </h2>
              <p className="text-[11px] text-text-muted">
                {selectedView === "week"
                  ? `주간 목표(${weeklyGoalCount}개)는 이번 주 기준으로 집계하고, 월간 목표(${monthlyGoalCount}개)는 이번 달 누적으로 집계합니다.`
                  : `${monthLabel ?? "선택한 달"} 기준으로 주간/월간 목표(${weeklyGoalCount + monthlyGoalCount}개)를 함께 집계합니다.`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="inline-flex w-fit text-[11px] text-text-muted bg-sub-background border border-border px-2 py-1 rounded font-mono">
                {selectedView === "week" ? weekLabel : monthLabel}
              </span>
              <Button
                asChild
                className="justify-center px-2.5 py-1.5 bg-white border border-border rounded-lg text-[11px] font-bold text-text-secondary hover:border-[rgba(205,207,213,1)] hover:text-primary transition-colors flex items-center gap-1"
              >
                <Link href="/setup?mode=addMeasure">
                  <Plus className="w-3 h-3" />
                  지표 추가
                </Link>
              </Button>
            </div>
          </div>

          {activeLeadMeasures.length === 0 ? (
            <div className="border border-border rounded-lg p-8 text-center text-text-muted text-sm">
              활성화된 선행지표가 없습니다.
            </div>
          ) : selectedView === "month" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-white px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-text-primary">
                      월간 기록판
                    </p>
                    <p className="text-[11px] text-text-muted">
                      선택한 달 전체 기록을 주차 흐름으로 보여줍니다.
                    </p>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    총 {monthlySummary?.achieved ?? 0}/
                    {monthlySummary?.total ?? 0}
                    {" · "}
                    {monthlyOverallRate}%
                  </p>
                </div>
              </div>
              {monthlyLeadMeasures.length === 0 ? (
                <div className="rounded-lg border border-border bg-white p-8 text-center text-sm text-text-muted">
                  선택한 달에 집계할 월간 선행지표가 없습니다.
                </div>
              ) : (
                <>
                  <MonthlyMobileCards
                    monthLabel={monthLabel}
                    monthWeeks={monthWeeks}
                    monthlyLeadMeasures={monthlyLeadMeasures}
                    today={today}
                  />

                  <div className="hidden space-y-4 md:block">
                    {monthWeeks.map((weekDatesInMonth, weekIndex) => (
                      <div
                        key={`${monthLabel}-week-${weekIndex + 1}`}
                        className="rounded-lg border border-border overflow-hidden bg-white"
                      >
                        <div className="border-b border-border bg-sub-background px-5 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-text-primary">
                              {weekIndex + 1}주차
                            </p>
                            <p className="text-[11px] font-mono text-text-muted">
                              {weekDatesInMonth
                                .find(Boolean)
                                ?.slice(5)
                                .replace("-", ".")}
                              {" – "}
                              {weekDatesInMonth
                                .filter((date): date is string => date !== null)
                                .at(-1)
                                ?.slice(5)
                                .replace("-", ".")}
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <div className="min-w-[600px]">
                            <div className="bg-sub-background border-b border-border">
                              <table className="w-full table-fixed text-xs">
                                <colgroup>
                                  <col className="w-[34%]" />
                                  {DAY_LABELS.map((day) => (
                                    <col key={day} className="w-[8%]" />
                                  ))}
                                  <col className="w-[10%]" />
                                  <col className="w-[16%]" />
                                </colgroup>
                                <thead>
                                  <tr>
                                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-text-muted">
                                      선행지표
                                    </th>
                                    {DAY_LABELS.map((label, dayIndex) => {
                                      const date = weekDatesInMonth[dayIndex];
                                      const isToday = date === today;

                                      return (
                                        <th
                                          key={`${weekIndex}-${label}`}
                                          className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest ${
                                            isToday
                                              ? "text-primary"
                                              : "text-text-muted"
                                          }`}
                                        >
                                          <div>{label}</div>
                                          <div className="mt-0.5 text-[10px] font-mono normal-case tracking-normal">
                                            {date ? date.slice(8, 10) : ""}
                                          </div>
                                        </th>
                                      );
                                    })}
                                    <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-muted">
                                      기간
                                    </th>
                                    <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-text-muted">
                                      달성
                                    </th>
                                  </tr>
                                </thead>
                              </table>
                            </div>

                            <table className="w-full table-fixed text-xs">
                              <colgroup>
                                <col className="w-[34%]" />
                                {DAY_LABELS.map((day) => (
                                  <col key={day} className="w-[8%]" />
                                ))}
                                <col className="w-[10%]" />
                                <col className="w-[16%]" />
                              </colgroup>
                              <tbody className="divide-y divide-border">
                                {monthlyLeadMeasures.map((leadMeasure) => {
                                  const targetValue =
                                    leadMeasure.targetValue ?? 0;
                                  const visibleAchievedCount =
                                    weekDatesInMonth.reduce((count, date) => {
                                      if (!date) {
                                        return count;
                                      }

                                      return leadMeasure.logs?.[date] === true
                                        ? count + 1
                                        : count;
                                    }, 0);
                                  const rate =
                                    targetValue > 0
                                      ? Math.round(
                                          (visibleAchievedCount / targetValue) *
                                            100,
                                        )
                                      : 0;

                                  return (
                                    <tr
                                      key={`${weekIndex}-${leadMeasure.id}`}
                                      className="bg-white"
                                    >
                                      <td className="px-5 py-4">
                                        <p className="truncate text-sm font-semibold text-text-primary">
                                          {leadMeasure.name}
                                        </p>
                                        <p className="text-[10px] text-text-muted">
                                          목표 {targetValue}회 /{" "}
                                          {leadMeasure.period === "WEEKLY"
                                            ? "주"
                                            : "월"}
                                        </p>
                                      </td>

                                      {weekDatesInMonth.map(
                                        (date, dayIndex) => {
                                          const value = date
                                            ? (leadMeasure.logs?.[date] ?? null)
                                            : null;
                                          const isToday = date === today;

                                          return (
                                            <td
                                              key={`${weekIndex}-${leadMeasure.id}-${DAY_LABELS[dayIndex]}`}
                                              className="py-3 text-center"
                                            >
                                              <span
                                                className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm font-bold ${
                                                  value === true
                                                    ? "border-primary bg-primary text-white"
                                                    : date === null
                                                      ? "border-transparent bg-transparent text-transparent"
                                                      : isToday
                                                        ? "border-primary/30 bg-primary/5 text-primary"
                                                        : "border-border bg-sub-background text-text-muted"
                                                }`}
                                              >
                                                {value === true ? (
                                                  <Check className="h-3.5 w-3.5" />
                                                ) : null}
                                              </span>
                                            </td>
                                          );
                                        },
                                      )}

                                      <td className="px-3 py-4 text-center text-[11px] text-text-secondary">
                                        {leadMeasure.period === "WEEKLY"
                                          ? "주간"
                                          : "월간"}
                                      </td>
                                      <td className="px-3 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                          <div className="w-10 h-1 overflow-hidden rounded-full border border-border bg-sub-background">
                                            <div
                                              className={`h-full rounded-full transition-all duration-500 ${
                                                rate >= 100
                                                  ? "bg-green-500"
                                                  : "bg-primary"
                                              }`}
                                              style={{
                                                width: `${Math.min(rate, 100)}%`,
                                              }}
                                            />
                                          </div>
                                          <span
                                            className={`text-[10px] font-bold font-mono ${
                                              rate >= 100
                                                ? "text-green-600"
                                                : "text-text-secondary"
                                            }`}
                                          >
                                            {visibleAchievedCount}/{targetValue}
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
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <WeeklyMobileCards
                activeLeadMeasures={activeLeadMeasures}
                onBeforeToggle={() => {
                  celebrationWatchRef.current = true;
                }}
                pendingLogKeys={pendingLogKeys}
                today={today}
                toggleLog={toggleLog}
                weekDates={weekDates}
                weeklyById={weeklyById}
              />

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
                        {activeLeadMeasures.map((leadMeasure) => {
                          const leadMeasureId = toNumberId(leadMeasure.id);
                          const weekly = weeklyById.get(leadMeasureId);
                          const achievedCount = weekly?.achieved ?? 0;
                          const targetValue = leadMeasure.targetValue ?? 0;
                          const rate =
                            targetValue > 0
                              ? Math.round((achievedCount / targetValue) * 100)
                              : 0;

                          return (
                            <tr key={leadMeasure.id} className="bg-white">
                              <td className="py-4 px-5">
                                <p className="block font-semibold text-text-primary truncate text-sm">
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
                                const currentValue =
                                  weekly?.logs?.[date] === undefined
                                    ? null
                                    : weekly.logs[date];
                                const isToday = date === today;
                                const currentLogKey =
                                  leadMeasureId === null
                                    ? null
                                    : `${leadMeasureId}:${date}`;
                                const isPending =
                                  currentLogKey !== null &&
                                  pendingLogKeys.has(currentLogKey);

                                return (
                                  <td key={date} className="py-3 text-center">
                                    <Button
                                      disabled={isPending || leadMeasureId === null}
                                      onClick={() => {
                                        if (leadMeasureId !== null) {
                                          celebrationWatchRef.current = true;
                                          void toggleLog(leadMeasureId, date);
                                        }
                                      }}
                                      className={`w-7 h-7 mx-auto rounded-md flex items-center justify-center border transition-colors ${
                                        currentValue === true
                                          ? "bg-primary border-primary text-white"
                                          : isToday
                                            ? "bg-primary/5 border-primary/30 text-primary"
                                            : "bg-sub-background border-border text-text-muted"
                                      } ${isPending ? "cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                      {currentValue === true ? (
                                        <Check className="w-3.5 h-3.5" />
                                      ) : null}
                                    </Button>
                                  </td>
                                );
                              })}

                              <td className="py-4 px-3 text-center">
                                <div className="flex flex-col items-center gap-1.5">
                                  <div className="w-10 h-1 bg-sub-background rounded-full overflow-hidden border border-border">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        rate >= 100
                                          ? "bg-green-500"
                                          : "bg-primary"
                                      }`}
                                      style={{
                                        width: `${Math.min(rate, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold font-mono ${
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
            </>
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

function getWeeklyCelebrationSnapshot(
  activeLeadMeasures: Array<{
    id?: string | number;
    period?: string;
    targetValue?: number | null;
  }>,
  weeklyById: Map<number | null, { achieved?: number | null }>,
): WeeklyCelebrationSnapshot {
  const weeklyMeasures = activeLeadMeasures.filter(
    (leadMeasure) => leadMeasure.period !== "MONTHLY",
  );

  return weeklyMeasures.reduce<WeeklyCelebrationSnapshot>(
    (snapshot, leadMeasure) => {
      const targetValue = leadMeasure.targetValue ?? 0;
      const achieved =
        weeklyById.get(toNumberId(leadMeasure.id))?.achieved ?? 0;
      const isCompleted = targetValue > 0 && achieved >= targetValue;

      return {
        completedCount: snapshot.completedCount + (isCompleted ? 1 : 0),
        totalCount: snapshot.totalCount + 1,
      };
    },
    { completedCount: 0, totalCount: 0 },
  );
}

function getCompletedWeeklyMeasureIds(
  activeLeadMeasures: Array<{
    id?: string | number;
    period?: string;
    targetValue?: number | null;
  }>,
  weeklyById: Map<number | null, { achieved?: number | null }>,
) {
  return new Set(
    activeLeadMeasures
      .filter((leadMeasure) => leadMeasure.period !== "MONTHLY")
      .map((leadMeasure) => {
        const leadMeasureId = toNumberId(leadMeasure.id);
        const targetValue = leadMeasure.targetValue ?? 0;
        const achieved = weeklyById.get(leadMeasureId)?.achieved ?? 0;

        return leadMeasureId !== null && targetValue > 0 && achieved >= targetValue
          ? leadMeasureId
          : null;
      })
      .filter((leadMeasureId): leadMeasureId is number => leadMeasureId !== null),
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
                <Plus className="w-4 h-4" />
                새 점수판 만들기
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
      ? DASHBOARD_LINKS.filter(({ href }) => href === "/profile")
      : DASHBOARD_LINKS.filter(({ href }) => href !== "/setup?mode=update");

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
