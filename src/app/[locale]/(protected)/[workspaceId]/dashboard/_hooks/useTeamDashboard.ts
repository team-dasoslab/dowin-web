"use client";

import { useGetWorkspacesWorkspaceIdDashboardTeam } from "@/api/generated/dashboard/dashboard";
import { TeamDashboardResponse } from "@/api/generated/dowin.schemas";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import {
  addDays,
  getTodayInKst,
  getWeekDates,
  isValidDateString,
} from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import {
  getApiErrorCode,
  getApiErrorStatus,
} from "@/lib/client/frontend-api";
import { useCallback, useEffect, useMemo, useState } from "react";

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

export const useTeamDashboard = (workspaceId: string) => {
  const today = getTodayInKst();
  const [selectedDate, setSelectedDateState] = useState(today);
  const selectedWeekStart = getWeekDates(selectedDate)[0] ?? today;
  const currentWeekStart = getWeekDates(today)[0] ?? today;
  const {
    data: workspaceResponse,
    error: workspaceError,
  } = useGetWorkspacesMe({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 2,
    },
  });
  const workspace =
    workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const isFreePlan = workspace?.planCode === "FREE" || !workspace?.planCode;
  const historyLimitDate = useMemo(() => {
    const [year, month] = today.split("-").map(Number);
    const limitDate = new Date(Date.UTC(year, month - 6, 1));
    return limitDate.toISOString().slice(0, 10);
  }, [today]);
  const isAllowedWeek = useCallback(
    (weekStart: string) => {
      if (!isFreePlan) {
        return true;
      }

      return addDays(weekStart, 6) >= historyLimitDate;
    },
    [historyLimitDate, isFreePlan],
  );
  const { data, isLoading, isFetching, error } = useGetWorkspacesWorkspaceIdDashboardTeam(
    workspaceId,
    selectedWeekStart ? { weekStart: selectedWeekStart } : undefined,
    {
      query: {
        retry: (failureCount, queryError) =>
          ![403, 404].includes(getApiErrorStatus(queryError) ?? 0) &&
          failureCount < 2,
      },
    },
  );
  const [lastDashboard, setLastDashboard] =
    useState<TeamDashboardResponse | null>(null);

  useEffect(() => {
    if (data?.status === 200) {
      setLastDashboard(data.data);
    }
  }, [data]);

  const dashboard: TeamDashboardResponse | null =
    data?.status === 200 ? data.data : lastDashboard;
  const weekDates = getWeekDatesFromStart(dashboard?.weekStart ?? selectedWeekStart);
  const weekLabel =
    weekDates.length === 7
      ? `${weekDates[0].slice(5).replace("-", ".")} – ${weekDates[6].slice(5).replace("-", ".")}`
      : "";
  const movePeriod = (direction: -1 | 1) => {
    const nextWeekStart = addDays(selectedWeekStart, direction * 7);

    if (direction === -1 && !isAllowedWeek(nextWeekStart)) {
      return;
    }

    setSelectedDateState(nextWeekStart);
  };
  const setSelectedDate = (value: string) => {
    if (!isValidDateString(value)) {
      return;
    }

    const nextWeekStart = getWeekDates(value)[0] ?? value;
    if (!isAllowedWeek(nextWeekStart)) {
      return;
    }

    setSelectedDateState(nextWeekStart);
  };
  const resetToToday = () => {
    setSelectedDateState(today);
  };
  const isHistoryLimited =
    getApiErrorStatus(error) === 403 &&
    getApiErrorCode(error) === "FREE_PLAN_HISTORY_LIMIT_REACHED";
  const hasNoWorkspace =
    getApiErrorStatus(error) === 404 || getApiErrorStatus(workspaceError) === 404;

  return {
    dashboard,
    hasNoWorkspace,
    historyLimitDate: isFreePlan ? historyLimitDate : undefined,
    isHistoryLimited,
    isLoading,
    isPeriodLoading: isFetching,
    isPreviousDisabled: !isAllowedWeek(addDays(selectedWeekStart, -7)),
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
