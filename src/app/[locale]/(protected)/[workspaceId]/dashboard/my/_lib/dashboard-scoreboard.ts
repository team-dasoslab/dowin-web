import {
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlyQueryKey,
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlySummaryQueryKey,
  getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyQueryKey,
  getWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyResponse200,
} from "@/api/generated/daily-log/daily-log";
import {
  getGetWorkspacesWorkspaceIdDashboardMyQueryKey,
  getWorkspacesWorkspaceIdDashboardMyResponse200,
} from "@/api/generated/dashboard/dashboard";
import { getWeekDates } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/week";
import { toNumberId } from "@/lib/client/frontend-api";

export type WeeklyLogsQueryData =
  | getWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyResponse200
  | undefined;
export type MyDashboardQueryData =
  | getWorkspacesWorkspaceIdDashboardMyResponse200
  | undefined;

import type { DailyLogCell } from "@/api/generated/dowin.schemas";

export type DailyLogValue = DailyLogCell | null;

export type DashboardView = "week" | "month";

export type ToggleLogContext = {
  currentLogKey: string;
  previousWeeklyLogs: WeeklyLogsQueryData;
  previousMyDashboard: MyDashboardQueryData;
  weeklyLogsQueryKey: ReturnType<
    typeof getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsWeeklyQueryKey
  > | null;
  myDashboardQueryKey: ReturnType<
    typeof getGetWorkspacesWorkspaceIdDashboardMyQueryKey
  > | null;
  monthlyLogsQueryKey: ReturnType<
    typeof getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlyQueryKey
  > | null;
  monthlySummaryQueryKey: ReturnType<
    typeof getGetWorkspacesWorkspaceIdScoreboardsScoreboardIdLogsMonthlySummaryQueryKey
  > | null;
};

export type WeeklyTrendPoint = {
  weekStart: string;
  label: string;
  rate: number;
};

export const getNextLogValue = (
  value: DailyLogValue | boolean | null,
): boolean | null => {
  if (value && typeof value === "object") {
    return value.value ? null : true;
  }
  return value === true ? null : true;
};

export const isEditableDailyLogDate = (date: string, today: string) => {
  const currentWeekStart = getWeekDates(today)[0];

  if (!currentWeekStart) {
    return true;
  }

  return date >= currentWeekStart;
};

export const isDashboardView = (
  value: string | null,
): value is DashboardView => {
  return value === "week" || value === "month";
};

export const computeWeeklyRate = (
  activeLeadMeasures: Array<{
    id?: string | number;
    period?: string;
    targetValue?: number | null;
  }>,
  weeklyLeadMeasures: Array<{
    id?: number;
    achieved?: number;
  }>,
): number => {
  const weeklyTargetMeasures = activeLeadMeasures.filter(
    (leadMeasure: { period?: string }) => leadMeasure.period !== "MONTHLY",
  );
  const weeklyById = new Map(
    weeklyLeadMeasures.map((leadMeasure) => [
      leadMeasure.id ?? null,
      leadMeasure,
    ]),
  );

  const achieved = weeklyTargetMeasures.reduce((accumulator, leadMeasure) => {
    const targetValue = leadMeasure.targetValue ?? 0;
    const weekly = weeklyById.get(toNumberId(leadMeasure.id));

    return accumulator + Math.min(weekly?.achieved ?? 0, targetValue);
  }, 0);

  const totalTarget = weeklyTargetMeasures.reduce(
    (accumulator, leadMeasure) => accumulator + (leadMeasure.targetValue ?? 0),
    0,
  );

  return totalTarget > 0 ? Math.round((achieved / totalTarget) * 100) : 0;
};

export const updateWeeklyLogsCache = (
  previous: WeeklyLogsQueryData,
  leadMeasureId: number,
  date: string,
  value: DailyLogValue,
): WeeklyLogsQueryData => {
  if (!previous || previous.status !== 200) {
    return previous;
  }

  return {
    ...previous,
    data: {
      ...previous.data,
      leadMeasures: previous.data.leadMeasures?.map((leadMeasure) => {
        if (toNumberId(leadMeasure.id) !== leadMeasureId) {
          return leadMeasure;
        }

        const nextLogs = {
          ...(leadMeasure.logs ?? {}),
          [date]:
            value && typeof value !== "object"
              ? { value: true, count: 0, achieved: true }
              : value,
        };
        const achieved = Object.values(nextLogs).filter((log) => {
          if (!log) return false;
          if (typeof log === "object" && "achieved" in log) return log.achieved;
          return true; // For legacy boolean logs
        }).length;
        const targetValue = leadMeasure.targetValue ?? 0;
        const achievementRate =
          targetValue > 0
            ? Math.round(
                (Math.min(achieved, targetValue) / targetValue) * 1000,
              ) / 10
            : 0;

        return {
          ...leadMeasure,
          logs: nextLogs,
          achieved,
          achievementRate,
        };
      }),
    },
  };
};

export const updateMyDashboardCache = (
  previous: MyDashboardQueryData,
  leadMeasureId: number,
  date: string,
  value: DailyLogValue,
): MyDashboardQueryData => {
  if (!previous || previous.status !== 200 || !previous.data.weeklyLogs) {
    return previous;
  }

  const nextWeeklyLogs = updateWeeklyLogsCache(
    { data: previous.data.weeklyLogs, status: 200 },
    leadMeasureId,
    date,
    value,
  );

  if (!nextWeeklyLogs || nextWeeklyLogs.status !== 200) {
    return previous;
  }

  return {
    ...previous,
    data: {
      ...previous.data,
      weeklyLogs: nextWeeklyLogs.data,
    },
  };
};
