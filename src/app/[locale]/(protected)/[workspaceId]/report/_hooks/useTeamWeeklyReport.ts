"use client";

import { useGetWorkspacesWorkspaceIdReportsTeamWeekly } from "@/api/generated/reports/reports";
import { getWeekDates } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { getApiErrorStatus } from "@/lib/client/frontend-api";

export const useTeamWeeklyReport = (workspaceId: string) => {
  const currentWeekDates = getWeekDates();
  const weekStart = currentWeekDates[0];
  const { data, isError, isLoading, error, refetch } = useGetWorkspacesWorkspaceIdReportsTeamWeekly(
    workspaceId,
    weekStart ? { weekStart, weeks: 5 } : undefined,
    {
      query: {
        retry: (failureCount, queryError) => {
          const status = getApiErrorStatus(queryError);
          return status !== 403 && status !== 404 && failureCount < 2;
        },
      },
    },
  );

  return {
    report: data?.status === 200 ? data.data : null,
    hasNoWorkspace: getApiErrorStatus(error) === 404,
    isForbidden: getApiErrorStatus(error) === 403,
    isError,
    isLoading,
    refetch,
  };
};
