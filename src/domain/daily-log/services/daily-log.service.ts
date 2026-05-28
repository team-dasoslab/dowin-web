import {
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import { WorkspaceLookupPort } from "@/domain/scoreboard/services/scoreboard.service";
import { DailyLogRecord, DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { assertFreePlanWithinMemberLimit } from "@/domain/workspace/plan-limits";
import {
  LeadMeasureRecord,
  LeadMeasureRecordWithTags,
  LeadMeasureTagRecord,
} from "@/domain/lead-measure/storage/lead-measure.storage";

type ScoreboardStoragePort = {
  findOwnedScoreboard(
    id: number,
    userId: number,
    workspaceId: number,
  ): Promise<{ id: number; status: "ACTIVE" | "ARCHIVED" } | undefined>;
};

type LeadMeasureStoragePort = {
  findOwnedLeadMeasure(
    id: number,
    userId: number,
    workspaceId: number,
  ): Promise<
    | (LeadMeasureRecord & {
      scoreboard: { id: number; status: "ACTIVE" | "ARCHIVED" };
    })
    | undefined
  >;
  findLeadMeasuresByScoreboard(
    scoreboardId: number,
    status: "active" | "all",
  ): Promise<LeadMeasureRecordWithTags[]>;
};

type DailyLogStoragePort = Pick<
  DailyLogStorage,
  "upsertLog" | "deleteLog" | "findLogsForLeadMeasures"
>;

export class DailyLogService {
  constructor(
    private workspaceStorage: WorkspaceLookupPort,
    private scoreboardStorage: ScoreboardStoragePort,
    private leadMeasureStorage: LeadMeasureStoragePort,
    private dailyLogStorage: DailyLogStoragePort,
  ) { }

  async upsertLog(
    workspaceUid: string,
    leadMeasureId: number,
    userId: number,
    date: string,
    value: boolean,
  ): Promise<DailyLogRecord> {
    assertPastWeekLogEditable(date);
    const { measure, workspace } = await this.getOwnedLeadMeasureWithWorkspace(
      workspaceUid,
      leadMeasureId,
      userId,
    );
    await assertFreePlanWithinMemberLimit(workspace, this.workspaceStorage);

    if (measure.status === "ARCHIVED") {
      throw new ForbiddenError("LEAD_MEASURE_ARCHIVED");
    }

    return await this.dailyLogStorage.upsertLog(leadMeasureId, date, value);
  }

  async deleteLog(workspaceUid: string, leadMeasureId: number, userId: number, date: string): Promise<void> {
    assertPastWeekLogEditable(date);
    const { workspace } = await this.getOwnedLeadMeasureWithWorkspace(
      workspaceUid,
      leadMeasureId,
      userId,
    );
    await assertFreePlanWithinMemberLimit(workspace, this.workspaceStorage);
    await this.dailyLogStorage.deleteLog(leadMeasureId, date);
  }

  async getWeeklyLogs(
    workspaceUid: string,
    scoreboardId: number,
    userId: number,
    weekStart?: string,
  ): Promise<{
    weekStart: string;
    weekEnd: string;
    leadMeasures: Array<{
      id: number;
      name: string;
      period: "WEEKLY" | "MONTHLY";
      targetValue: number;
      tags: LeadMeasureTagRecord[];
      logs: Record<string, boolean | null>;
      achieved: number;
      achievementRate: number;
      guide: {
        kind: "adjust" | "change";
        description: string;
      } | null;
    }>;
  }> {
    const { scoreboard, workspace } = await this.getOwnedScoreboardWithWorkspace(workspaceUid, scoreboardId, userId);
    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    const normalizedWeekStart = weekStart ?? getCurrentWeekStart();
    assertHistoryLimit(workspace.planCode ?? "FREE", normalizedWeekStart);

    const weekDates = getWeekDates(normalizedWeekStart);
    const weekEnd = weekDates[6];
    const previousWeekStart = addDays(normalizedWeekStart, -7);
    const shouldIncludeGuide = normalizedWeekStart === getCurrentWeekStart();
    const measures = await this.leadMeasureStorage.findLeadMeasuresByScoreboard(
      scoreboardId,
      "active",
    );
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      measures.map((measure) => measure.id),
      previousWeekStart,
      weekEnd,
    );

    return {
      weekStart: normalizedWeekStart,
      weekEnd,
      leadMeasures: measures.map((measure) => {
        const measureLogs = logs.filter((log) => log.leadMeasureId === measure.id);
        const logMap = Object.fromEntries(
          weekDates.map((date) => [date, null as boolean | null]),
        );

        for (const log of measureLogs) {
          if (log.logDate in logMap) {
            logMap[log.logDate] = log.value;
          }
        }

        const currentWeekLogs = measureLogs.filter(
          (log) => log.logDate >= normalizedWeekStart && log.logDate <= weekEnd,
        );
        const previousWeekLogs = measureLogs.filter(
          (log) =>
            log.logDate >= previousWeekStart && log.logDate < normalizedWeekStart,
        );
        const achieved = currentWeekLogs.filter((log) => log.value).length;
        return {
          id: measure.id,
          name: measure.name,
          period: measure.period === "MONTHLY" ? "MONTHLY" : "WEEKLY",
          targetValue: measure.targetValue,
          tags: measure.tags ?? [],
          logs: logMap,
          achieved,
          achievementRate: getAchievementRate(achieved, measure.targetValue),
          guide: shouldIncludeGuide
            ? getWeeklyGuide({
              createdAt: measure.createdAt,
              currentAchieved: achieved,
              period: measure.period,
              previousAchieved: previousWeekLogs.filter((log) => log.value).length,
              previousWeekStart,
              targetValue: measure.targetValue,
            })
            : null,
        };
      }),
    };
  }

  async getMonthlyLogs(
    workspaceUid: string,
    scoreboardId: number,
    userId: number,
    monthStart?: string,
  ): Promise<{
    monthStart: string;
    monthEnd: string;
    monthLabel: string;
    summary: {
      achieved: number;
      total: number;
      achievementRate: number;
      isWinning: boolean;
    };
    leadMeasures: Array<{
      id: number;
      name: string;
      period: "DAILY" | "WEEKLY" | "MONTHLY";
      targetValue: number;
      tags: LeadMeasureTagRecord[];
      logs: Record<string, boolean | null>;
      achieved: number;
      achievementRate: number;
    }>;
  }> {
    const { scoreboard, workspace } = await this.getOwnedScoreboardWithWorkspace(workspaceUid, scoreboardId, userId);
    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    const normalizedMonthStart = normalizeMonthStart(monthStart);
    assertHistoryLimit(workspace.planCode ?? "FREE", normalizedMonthStart);

    const monthDates = getMonthDates(normalizedMonthStart);
    const monthEnd = monthDates[monthDates.length - 1];
    const weekStarts = getWeekStartsInMonth(monthDates);

    const fetchStart = weekStarts[0] ?? normalizedMonthStart;
    const fetchEnd = addDays(weekStarts[weekStarts.length - 1] ?? normalizedMonthStart, 6);

    const measures = (
      await this.leadMeasureStorage.findLeadMeasuresByScoreboard(
        scoreboardId,
        "active",
      )
    ).filter(
      (
        measure,
      ): measure is LeadMeasureRecordWithTags & { period: "DAILY" | "WEEKLY" | "MONTHLY" } =>
        measure.period === "DAILY" || measure.period === "WEEKLY" || measure.period === "MONTHLY",
    );
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      measures.map((measure) => measure.id),
      fetchStart,
      fetchEnd,
    );
    const leadMeasures = measures.map((measure) => {
      const measureLogs = logs.filter((log) => log.leadMeasureId === measure.id);
      const logMap = Object.fromEntries(
        monthDates.map((date) => [date, null as boolean | null]),
      );

      for (const log of measureLogs) {
        if (log.logDate >= normalizedMonthStart && log.logDate <= monthEnd) {
          logMap[log.logDate] = log.value;
        }
      }

      const achieved = measureLogs.filter((log) => log.logDate >= normalizedMonthStart && log.logDate <= monthEnd && log.value).length;

      return {
        id: measure.id,
        name: measure.name,
        period: measure.period,
        targetValue: measure.targetValue,
        tags: measure.tags ?? [],
        logs: logMap,
        achieved,
        achievementRate: getAchievementRate(achieved, measure.targetValue),
      };
    });
    const totalAchieved = measures.reduce((accumulator, measure) => {
      const measureLogs = logs.filter(
        (log) => log.leadMeasureId === measure.id && log.value,
      );

      if (measure.period === "MONTHLY") {
        const monthlyLogsCount = measureLogs.filter(
          (log) => log.logDate >= normalizedMonthStart && log.logDate <= monthEnd
        ).length;
        return accumulator + Math.min(monthlyLogsCount, measure.targetValue);
      }

      const weeklyAchieved = weekStarts.reduce((weekAccumulator, weekStart) => {
        const weekTrueCount = measureLogs.filter(
          (log) => getWeekStart(log.logDate) === weekStart,
        ).length;

        return weekAccumulator + Math.min(weekTrueCount, measure.targetValue);
      }, 0);

      return accumulator + weeklyAchieved;
    }, 0);
    const totalTarget = measures.reduce((accumulator, measure) => {
      if (measure.period === "MONTHLY") {
        return accumulator + measure.targetValue;
      }

      return accumulator + measure.targetValue * weekStarts.length;
    }, 0);
    const summaryRate =
      totalTarget > 0
        ? Number(((totalAchieved / totalTarget) * 100).toFixed(1))
        : 0;

    return {
      monthStart: normalizedMonthStart,
      monthEnd,
      monthLabel: `${normalizedMonthStart.slice(0, 4)}.${normalizedMonthStart.slice(
        5,
        7,
      )}`,
      summary: {
        achieved: totalAchieved,
        total: totalTarget,
        achievementRate: summaryRate,
        isWinning: summaryRate >= 80,
      },
      leadMeasures,
    };
  }

  private async getOwnedScoreboardWithWorkspace(workspaceUid: string, scoreboardId: number, userId: number) {
    const workspace = await this.getWorkspace(workspaceUid, userId);

    const scoreboard = await this.scoreboardStorage.findOwnedScoreboard(
      scoreboardId,
      userId,
      workspace.id,
    );
    return { scoreboard, workspace };
  }

  private async getOwnedLeadMeasureWithWorkspace(
    workspaceUid: string,
    leadMeasureId: number,
    userId: number,
  ) {
    const workspace = await this.getWorkspace(workspaceUid, userId);

    const measure = await this.leadMeasureStorage.findOwnedLeadMeasure(
      leadMeasureId,
      userId,
      workspace.id,
    );
    if (!measure || !measure.scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    return { measure, workspace };
  }

  private async getWorkspace(workspaceUid: string, userId: number) {
    const internalId = await this.workspaceStorage.resolveIdByUid(workspaceUid);
    if (!internalId) {
      throw new NotFoundError("NOT_FOUND");
    }

    const membership = await this.workspaceStorage.findMembership(internalId, userId);
    if (!membership) {
      throw new NotFoundError("NOT_FOUND");
    }

    const workspace = await this.workspaceStorage.findWorkspaceById(internalId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    return workspace;
  }
}

function getAchievementRate(achieved: number, targetValue: number) {
  if (targetValue <= 0) {
    return 0;
  }

  return Number(((Math.min(achieved, targetValue) / targetValue) * 100).toFixed(1));
}

function getWeeklyGuide({
  createdAt,
  currentAchieved,
  period,
  previousAchieved,
  previousWeekStart,
  targetValue,
}: {
  createdAt: Date;
  currentAchieved: number;
  period: LeadMeasureRecord["period"];
  previousAchieved: number;
  previousWeekStart: string;
  targetValue: number;
}) {
  if (period === "MONTHLY" || targetValue <= 0) {
    return null;
  }

  if (formatDateLocal(createdAt) > previousWeekStart) {
    return null;
  }

  if (currentAchieved === 0 && previousAchieved === 0) {
    return {
      kind: "change" as const,
      description:
        "2주 연속 기록이 없어요. 이 선행지표는 다른 행동으로 바꿔보세요.",
    };
  }

  const currentRate = getAchievementRate(currentAchieved, targetValue);
  const previousRate = getAchievementRate(previousAchieved, targetValue);

  if (currentRate < 50 && previousRate < 50) {
    return {
      kind: "adjust" as const,
      description:
        "2주 연속 50% 미만이에요. 이 선행지표는 횟수를 조금 낮춰보세요.",
    };
  }

  return null;
}

function getCurrentWeekStart() {
  return getWeekStart(getTodayInKst());
}

function getWeekDates(weekStart: string) {
  const base = new Date(weekStart);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return formatDateLocal(date);
  });
}

function addDays(dateString: string, amount: number) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + amount);
  return formatDateLocal(date);
}

function getCurrentMonthStart() {
  const today = new Date();
  return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-01`;
}

function normalizeMonthStart(monthStart?: string) {
  if (!monthStart) {
    return getCurrentMonthStart();
  }

  const [yearRaw, monthRaw] = monthStart.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  ) {
    return `${year}-${pad2(month)}-01`;
  }

  return getCurrentMonthStart();
}

function getMonthDates(monthStart: string) {
  const [yearRaw, monthRaw] = monthStart.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month - 1, index + 1);
    return formatDateLocal(date);
  });
}

function getWeekStart(dateString: string) {
  const [yearRaw, monthRaw, dayRaw] = dateString.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const date = new Date(year, month - 1, day);
  const weekDay = date.getDay();
  const diff = date.getDate() - weekDay + (weekDay === 0 ? -6 : 1);
  return formatDateLocal(new Date(year, month - 1, diff));
}

function getWeekStartsInMonth(monthDates: string[]) {
  const weekStarts = new Set<string>();

  for (const date of monthDates) {
    weekStarts.add(getWeekStart(date));
  }

  return Array.from(weekStarts.values());
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateLocal(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

function assertPastWeekLogEditable(date: string) {
  if (date < getCurrentWeekStart()) {
    throw new ForbiddenError("PAST_WEEK_LOG_EDIT_NOT_ALLOWED");
  }
}

function assertHistoryLimit(planCode: string, requestedDate: string) {
  if (planCode !== "FREE") return;

  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const limitDate = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth() - 5, 1));
  const limitDateString = `${limitDate.getUTCFullYear()}-${String(limitDate.getUTCMonth() + 1).padStart(2, '0')}-01`;

  // 주간 보기일 수 있으므로(주로 월요일 시작), 요청된 날짜로부터 6일 뒤(해당 주의 끝)가 제한일 이후인지 봅니다.
  const checkBase = new Date(requestedDate);
  const checkDateString = formatDateLocal(new Date(checkBase.getTime() + 6 * 24 * 60 * 60 * 1000));

  if (checkDateString < limitDateString) {
    throw new ForbiddenError("FREE_PLAN_HISTORY_LIMIT_REACHED");
  }
}

function getTodayInKst(referenceDate: Date = new Date()) {
  const kstDate = new Date(referenceDate.getTime() + 9 * 60 * 60 * 1000);
  return `${kstDate.getUTCFullYear()}-${pad2(kstDate.getUTCMonth() + 1)}-${pad2(
    kstDate.getUTCDate(),
  )}`;
}
