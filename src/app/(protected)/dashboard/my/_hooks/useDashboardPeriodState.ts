"use client";

import {
  addDays,
  addMonths,
  getMonthStart,
  getTodayInKst,
  getWeekDates,
  isValidDateString,
} from "@/app/(protected)/dashboard/my/_lib/week";
import {
  DashboardView,
  isDashboardView,
} from "@/app/(protected)/dashboard/my/_lib/dashboard-scoreboard";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useDashboardPeriodState = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const today = getTodayInKst();
  const selectedViewParam = searchParams.get("view");
  const selectedView: DashboardView = isDashboardView(selectedViewParam)
    ? selectedViewParam
    : "week";
  const rawSelectedDate = isValidDateString(searchParams.get("date"))
    ? (searchParams.get("date") as string)
    : today;
  const weekDates = getWeekDates(rawSelectedDate);
  const selectedWeekStart = weekDates[0] ?? today;
  const selectedMonthStart = getMonthStart(rawSelectedDate);
  const selectedDate =
    selectedView === "month" ? rawSelectedDate : selectedWeekStart;
  const currentWeekDates = getWeekDates(today);

  const setPeriodState = (nextView: DashboardView, nextDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    params.set("date", nextDate);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setSelectedView = (view: DashboardView) => {
    setPeriodState(view, rawSelectedDate);
  };

  const setSelectedDate = (date: string) => {
    if (!isValidDateString(date)) {
      return;
    }

    setPeriodState(
      selectedView,
      selectedView === "month"
        ? getMonthStart(date)
        : (getWeekDates(date)[0] ?? date),
    );
  };

  const movePeriod = (direction: -1 | 1) => {
    const nextDate =
      selectedView === "month"
        ? addMonths(rawSelectedDate, direction)
        : addDays(selectedWeekStart, direction * 7);

    setPeriodState(selectedView, nextDate);
  };

  const resetToToday = () => {
    setPeriodState(selectedView, today);
  };

  return {
    currentWeekDates,
    movePeriod,
    rawSelectedDate,
    resetToToday,
    selectedDate,
    selectedMonthStart,
    selectedView,
    selectedWeekStart,
    setSelectedDate,
    setSelectedView,
    today,
    weekDates,
  };
};
