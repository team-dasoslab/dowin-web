"use client";

import { useGetDashboardTeam } from "@/api/generated/dashboard/dashboard";
import { getWeekDates } from "@/app/(protected)/dashboard/my/_lib/week";
import { getApiErrorStatus } from "@/lib/client/frontend-api";

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

export const useTeamDashboard = () => {
  const currentWeekDates = getWeekDates();
  const weekStart = currentWeekDates[0];
  const { data, isLoading, error } = useGetDashboardTeam(
    weekStart ? { weekStart } : undefined,
    {
    query: {
      retry: (failureCount, queryError) =>
        getApiErrorStatus(queryError) !== 404 && failureCount < 2,
    },
    },
  );

  const dashboard = data?.status === 200 ? data.data : null;
  const weekDates = getWeekDatesFromStart(dashboard?.weekStart);

  return {
    dashboard,
    hasNoWorkspace: getApiErrorStatus(error) === 404,
    isLoading,
    weekDates,
  };
};
