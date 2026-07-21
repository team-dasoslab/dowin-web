"use client";

import type { getWorkspacesWorkspaceIdDashboardTeamResponse } from "@/api/generated/dashboard/dashboard";
import { useGetWorkspacesWorkspaceIdDashboardTeam } from "@/api/generated/dashboard/dashboard";
import { TeamDashboardResponse } from "@/api/generated/dowin.schemas";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import {
  addDays,
  getTodayInKst,
  getWeekDates,
  isValidDateString,
} from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { useEffect, useState } from "react";

const getWeekDatesFromStart = (weekStart?: string) => {
  if (!weekStart) {
    return [];
  }

  const [year, month, day] = weekStart.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setUTCDate(base.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
};

export const useTeamDashboard = (
  workspaceId: string,
  initialTeamDashboard?: getWorkspacesWorkspaceIdDashboardTeamResponse,
) => {
  const today = getTodayInKst();
  const [selectedDate, setSelectedDateState] = useState(today);
  const selectedWeekStart = getWeekDates(selectedDate)[0] ?? today;
  const currentWeekStart = getWeekDates(today)[0] ?? today;
  const { error: workspaceError } = useGetWorkspacesMe({
    query: {
      retry: (failureCount, error) => getApiErrorStatus(error) !== 404 && failureCount < 2,
    },
  });
  const { data, isLoading, isFetching, error } = useGetWorkspacesWorkspaceIdDashboardTeam(
    workspaceId,
    selectedWeekStart ? { weekStart: selectedWeekStart } : undefined,
    {
      query: {
        initialData: initialTeamDashboard,
        retry: (failureCount, queryError) =>
          ![403, 404].includes(getApiErrorStatus(queryError) ?? 0) && failureCount < 2,
      },
    },
  );
  const [lastDashboard, setLastDashboard] = useState<TeamDashboardResponse | null>(null);

  useEffect(() => {
    if (data?.status === 200) {
      setLastDashboard(data.data);
    }
  }, [data]);

  const dashboard: TeamDashboardResponse | null = data?.status === 200 ? data.data : lastDashboard;
  const weekDates = getWeekDatesFromStart(dashboard?.weekStart ?? selectedWeekStart);
  const weekLabel =
    weekDates.length === 7
      ? `${weekDates[0].slice(5).replace("-", ".")} – ${weekDates[6].slice(5).replace("-", ".")}`
      : "";
  const movePeriod = (direction: -1 | 1) => {
    const nextWeekStart = addDays(selectedWeekStart, direction * 7);

    setSelectedDateState(nextWeekStart);
  };
  const setSelectedDate = (value: string) => {
    if (!isValidDateString(value)) {
      return;
    }

    const nextWeekStart = getWeekDates(value)[0] ?? value;
    setSelectedDateState(nextWeekStart);
  };
  const resetToToday = () => {
    setSelectedDateState(today);
  };
  const hasNoWorkspace =
    getApiErrorStatus(error) === 404 || getApiErrorStatus(workspaceError) === 404;

  return {
    dashboard,
    hasNoWorkspace,
    isLoading: isLoading && !lastDashboard,
    isPeriodLoading: isFetching,
    isPreviousDisabled: false,
    isResetVisible: selectedWeekStart !== currentWeekStart,
    movePeriod,
    resetToToday,
    selectedDate,
    setSelectedDate,
    today,
    weekLabel,
    weekDates,
  };
};
