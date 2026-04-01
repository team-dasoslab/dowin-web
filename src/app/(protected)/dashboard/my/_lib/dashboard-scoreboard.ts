import {
  getGetScoreboardsScoreboardIdLogsMonthlyQueryKey,
  getGetScoreboardsScoreboardIdLogsWeeklyQueryKey,
  getScoreboardsScoreboardIdLogsWeeklyResponse200,
} from "@/api/generated/daily-log/daily-log";
import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import { toNumberId } from "@/lib/client/frontend-api";

export type WeeklyLogsQueryData =
  | getScoreboardsScoreboardIdLogsWeeklyResponse200
  | undefined;

export type DailyLogValue = boolean | null;

export type DashboardView = "week" | "month";

export type ToggleLogContext = {
  currentLogKey: string;
  previousWeeklyLogs: WeeklyLogsQueryData;
  weeklyLogsQueryKey: ReturnType<
    typeof getGetScoreboardsScoreboardIdLogsWeeklyQueryKey
  > | null;
  monthlyLogsQueryKey: ReturnType<
    typeof getGetScoreboardsScoreboardIdLogsMonthlyQueryKey
  > | null;
  dashboardTeamQueryKey: ReturnType<typeof getGetDashboardTeamQueryKey>;
};

export type WeeklyTrendPoint = {
  weekStart: string;
  label: string;
  rate: number;
};

export const getNextLogValue = (value: DailyLogValue): DailyLogValue => {
  return value === true ? null : true;
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
    (leadMeasure) => leadMeasure.period !== "MONTHLY",
  );
  const weeklyById = new Map(
    weeklyLeadMeasures.map((leadMeasure) => [leadMeasure.id ?? null, leadMeasure]),
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
          [date]: value,
        };
        const achieved = Object.values(nextLogs).filter(Boolean).length;
        const targetValue = leadMeasure.targetValue ?? 0;
        const achievementRate =
          targetValue > 0
            ? Math.round((Math.min(achieved, targetValue) / targetValue) * 1000) /
              10
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
