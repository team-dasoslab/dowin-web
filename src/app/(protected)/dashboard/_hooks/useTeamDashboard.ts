"use client";

import { useGetDashboardTeam } from "@/api/generated/dashboard/dashboard";
import { getApiErrorStatus } from "@/lib/client/frontend-api";

const getWeekDatesFromStart = (weekStart?: string) => {
  if (!weekStart) {
    return [];
  }

  const base = new Date(weekStart);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
};

export const useTeamDashboard = () => {
  const { data, isLoading, error } = useGetDashboardTeam(undefined, {
    query: {
      retry: (failureCount, queryError) =>
        getApiErrorStatus(queryError) !== 404 && failureCount < 2,
    },
  });

  const dashboard = data?.status === 200 ? data.data : null;
  const weekDates = getWeekDatesFromStart(dashboard?.weekStart);

  return {
    dashboard,
    hasNoWorkspace: getApiErrorStatus(error) === 404,
    isLoading,
    weekDates,
  };
};
