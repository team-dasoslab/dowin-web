import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import { WorkspaceLookupPort } from "@/domain/scoreboard/services/scoreboard.service";
import { DailyLogRecord, DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { assertWorkspaceOperationAllowed } from "@/domain/workspace/plan-limits";
import {
  LeadMeasureRecord,
  LeadMeasureRecordWithTags,
  LeadMeasureSummaryRecord,
  LeadMeasureTagRecord,
} from "@/domain/lead-measure/storage/lead-measure.storage";

type WorkspaceSummary = {
  id: number;
  planCode?: string | null;
};

type DailyLogWorkspacePort = WorkspaceLookupPort & {
  findAccessibleWorkspaceByUid?(
    uid: string,
    userId: number,
  ): Promise<WorkspaceSummary | null>;
};

type ScoreboardStoragePort = {
  findOwnedScoreboardSummary(
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
  findActiveLeadMeasureSummariesByScoreboard(
    scoreboardId: number,
  ): Promise<LeadMeasureSummaryRecord[]>;
};

type DailyLogStoragePort = Pick<
  DailyLogStorage,
  "upsertLog" | "deleteLog" | "findLogsForLeadMeasures"
>;

type DailyLogUpsertInput =
  | { value: true }
  | { count: number };

type DailyLogCell = {
  value: boolean;
  count: number;
  achieved: boolean;
};

type DailyLogResponse = DailyLogRecord & {
  achieved: boolean;
};

export class DailyLogService {
  constructor(
    private workspaceStorage: DailyLogWorkspacePort,
    private scoreboardStorage: ScoreboardStoragePort,
    private leadMeasureStorage: LeadMeasureStoragePort,
    private dailyLogStorage: DailyLogStoragePort,
  ) { }

  async upsertLog(
    workspaceUid: string,
    leadMeasureId: number,
    userId: number,
    date: string,
    input: DailyLogUpsertInput,
  ): Promise<DailyLogResponse> {
    assertPastWeekLogEditable(date);
    const { measure, workspace } = await this.getOwnedLeadMeasureWithWorkspace(
      workspaceUid,
      leadMeasureId,
      userId,
    );
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);

    if (measure.status === "ARCHIVED") {
      throw new ForbiddenError("LEAD_MEASURE_ARCHIVED");
    }

    const count = getValidatedUpsertCount(measure, input);
    const record = await this.dailyLogStorage.upsertLog(
      leadMeasureId,
      date,
      true,
      count,
    );

    return {
      ...record,
      achieved: isLogAchieved(measure, record),
    };
  }

  async deleteLog(workspaceUid: string, leadMeasureId: number, userId: number, date: string): Promise<void> {
    assertPastWeekLogEditable(date);
    const { workspace } = await this.getOwnedLeadMeasureWithWorkspace(
      workspaceUid,
      leadMeasureId,
      userId,
    );
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);
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
      trackingMode: "BOOLEAN" | "COUNT";
      dailyTargetCount: number;
      tags: LeadMeasureTagRecord[];
      logs: Record<string, DailyLogCell | null>;
      achieved: number;
      total: number;
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
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);

    const normalizedWeekStart = weekStart ?? getCurrentWeekStart();

    const weekDates = getWeekDates(normalizedWeekStart);
    const weekEnd = weekDates[6];
    const previousWeekStart = addDays(normalizedWeekStart, -7);
    const shouldIncludeGuide = normalizedWeekStart === getCurrentWeekStart();
    const measures = (await this.leadMeasureStorage.findLeadMeasuresByScoreboard(
      scoreboardId,
      "active",
    )).filter((measure) => isMeasureActiveInPeriod(measure, weekEnd));
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      measures.map((measure) => measure.id),
      previousWeekStart,
      weekEnd,
    );
    const logsByLeadMeasure = groupLogsByLeadMeasure(logs);

    return {
      weekStart: normalizedWeekStart,
      weekEnd,
      leadMeasures: measures.map((measure) => {
        const measureLogs = logsByLeadMeasure.get(measure.id) ?? [];
        const logMap = Object.fromEntries(
          weekDates.map((date) => [date, null as DailyLogCell | null]),
        );
        let achieved = 0;
        let previousAchieved = 0;

        for (const log of measureLogs) {
          if (log.logDate in logMap) {
            logMap[log.logDate] = getLogCell(measure, log);
          }

          if (!isLogAchieved(measure, log)) {
            continue;
          }

          if (log.logDate >= normalizedWeekStart && log.logDate <= weekEnd) {
            achieved += 1;
            continue;
          }

          if (
            log.logDate >= previousWeekStart &&
            log.logDate < normalizedWeekStart
          ) {
            previousAchieved += 1;
          }
        }

        return {
          id: measure.id,
          name: measure.name,
          period: measure.period === "MONTHLY" ? "MONTHLY" : "WEEKLY",
          targetValue: measure.targetValue,
          trackingMode: getTrackingMode(measure),
          dailyTargetCount: getDailyTargetCount(measure),
          tags: measure.tags ?? [],
          logs: logMap,
          achieved,
          total: measure.targetValue,
          achievementRate: getAchievementRate(achieved, measure.targetValue),
          guide: shouldIncludeGuide
            ? getWeeklyGuide({
              createdAt: measure.createdAt,
              currentAchieved: achieved,
              period: measure.period,
              previousAchieved,
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
      trackingMode: "BOOLEAN" | "COUNT";
      dailyTargetCount: number;
      tags: LeadMeasureTagRecord[];
      logs: Record<string, DailyLogCell | null>;
      achieved: number;
      total: number;
      achievementRate: number;
    }>;
  }> {
    const { scoreboard, workspace } = await this.getOwnedScoreboardWithWorkspace(workspaceUid, scoreboardId, userId);
    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);

    const normalizedMonthStart = normalizeMonthStart(monthStart);

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
        (measure.period === "DAILY" || measure.period === "WEEKLY" || measure.period === "MONTHLY") &&
        isMeasureActiveInPeriod(measure, monthEnd),
    );
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      measures.map((measure) => measure.id),
      fetchStart,
      fetchEnd,
    );
    const logsByLeadMeasure = groupLogsByLeadMeasure(logs);
    const weekStartSet = new Set(weekStarts);
    let totalAchieved = 0;

    const leadMeasures = measures.map((measure) => {
      const measureLogs = logsByLeadMeasure.get(measure.id) ?? [];
      const logMap = Object.fromEntries(
        monthDates.map((date) => [date, null as DailyLogCell | null]),
      );
      let achieved = 0;
      let monthlySummaryAchieved = 0;
      const weeklySummaryAchievedByWeek = new Map<string, number>();

      for (const log of measureLogs) {
        const isInMonth =
          log.logDate >= normalizedMonthStart && log.logDate <= monthEnd;

        if (isInMonth) {
          logMap[log.logDate] = getLogCell(measure, log);
          if (isLogAchieved(measure, log)) {
            achieved += 1;
          }
        }

        if (!isLogAchieved(measure, log)) {
          continue;
        }

        if (measure.period === "MONTHLY") {
          if (isInMonth) {
            monthlySummaryAchieved += 1;
          }
          continue;
        }

        const logWeekStart = getWeekStart(log.logDate);
        if (weekStartSet.has(logWeekStart)) {
          weeklySummaryAchievedByWeek.set(
            logWeekStart,
            (weeklySummaryAchievedByWeek.get(logWeekStart) ?? 0) + 1,
          );
        }
      }

      if (measure.period === "MONTHLY") {
        totalAchieved += Math.min(monthlySummaryAchieved, measure.targetValue);
      } else {
        const effectiveWeekStarts = getEffectiveWeekStarts(measure, weekStarts);
        totalAchieved += effectiveWeekStarts.reduce(
          (weekAccumulator, weekStart) =>
            weekAccumulator +
            Math.min(
              weeklySummaryAchievedByWeek.get(weekStart) ?? 0,
              measure.targetValue,
            ),
          0,
        );
      }

      return {
        id: measure.id,
        name: measure.name,
        period: measure.period,
        targetValue: measure.targetValue,
        trackingMode: getTrackingMode(measure),
        dailyTargetCount: getDailyTargetCount(measure),
        tags: measure.tags ?? [],
        logs: logMap,
        achieved,
        total: measure.targetValue,
        achievementRate: getAchievementRate(achieved, measure.targetValue),
      };
    });
    const totalTarget = measures.reduce((accumulator, measure) => {
      if (measure.period === "MONTHLY") {
        return accumulator + measure.targetValue;
      }

      const effectiveWeekStarts = getEffectiveWeekStarts(measure, weekStarts);
      return accumulator + measure.targetValue * effectiveWeekStarts.length;
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

  async getMonthlySummary(
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
  }> {
    const { scoreboard, workspace } = await this.getOwnedScoreboardWithWorkspace(
      workspaceUid,
      scoreboardId,
      userId,
    );
    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);

    const normalizedMonthStart = normalizeMonthStart(monthStart);
    const monthDates = getMonthDates(normalizedMonthStart);
    const monthEnd = monthDates[monthDates.length - 1];
    const weekStarts = getWeekStartsInMonth(monthDates);
    const fetchStart = weekStarts[0] ?? normalizedMonthStart;
    const fetchEnd = addDays(
      weekStarts[weekStarts.length - 1] ?? normalizedMonthStart,
      6,
    );

    const measures = (
      await this.leadMeasureStorage.findActiveLeadMeasureSummariesByScoreboard(
        scoreboardId,
      )
    ).filter((measure) => isMonthlySummaryMeasure(measure) && isMeasureActiveInPeriod(measure, monthEnd));
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      measures.map((measure) => measure.id),
      fetchStart,
      fetchEnd,
    );

    return {
      monthStart: normalizedMonthStart,
      monthEnd,
      monthLabel: getMonthLabel(normalizedMonthStart),
      summary: calculateMonthlySummary({
        logs,
        measures,
        monthEnd,
        monthStart: normalizedMonthStart,
        weekStarts,
      }),
    };
  }

  private async getOwnedScoreboardWithWorkspace(workspaceUid: string, scoreboardId: number, userId: number) {
    const workspace = await this.getWorkspace(workspaceUid, userId);

    const scoreboard = await this.scoreboardStorage.findOwnedScoreboardSummary(
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
    if (this.workspaceStorage.findAccessibleWorkspaceByUid) {
      const workspace = await this.workspaceStorage.findAccessibleWorkspaceByUid(
        workspaceUid,
        userId,
      );
      if (!workspace) {
        throw new NotFoundError("NOT_FOUND");
      }

      return workspace;
    }

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

function calculateMonthlySummary({
  logs,
  measures,
  monthEnd,
  monthStart,
  weekStarts,
}: {
  logs: DailyLogRecord[];
  measures: Array<Pick<LeadMeasureSummaryRecord, "id" | "period" | "targetValue" | "trackingMode" | "dailyTargetCount" | "status" | "createdAt">>;
  monthEnd: string;
  monthStart: string;
  weekStarts: string[];
}) {
  const logsByLeadMeasure = groupLogsByLeadMeasure(logs);
  const weekStartSet = new Set(weekStarts);
  const achieved = measures.reduce((total, measure) => {
    const measureLogs = logsByLeadMeasure.get(measure.id) ?? [];

    if (measure.period === "MONTHLY") {
      const monthlyCount = measureLogs.reduce((count, log) => {
        if (
          log.logDate >= monthStart &&
          log.logDate <= monthEnd &&
          isLogAchieved(measure, log)
        ) {
          return count + 1;
        }

        return count;
      }, 0);

      return total + Math.min(monthlyCount, measure.targetValue);
    }

    const weeklyCounts = new Map<string, number>();
    for (const log of measureLogs) {
      if (!isLogAchieved(measure, log)) {
        continue;
      }

      const weekStart = getWeekStart(log.logDate);
      if (!weekStartSet.has(weekStart)) {
        continue;
      }

      weeklyCounts.set(weekStart, (weeklyCounts.get(weekStart) ?? 0) + 1);
    }

    const effectiveWeekStarts = getEffectiveWeekStarts(measure, weekStarts);
    return (
      total +
      effectiveWeekStarts.reduce(
        (weekTotal, weekStart) =>
          weekTotal +
          Math.min(weeklyCounts.get(weekStart) ?? 0, measure.targetValue),
        0,
      )
    );
  }, 0);
  const total = measures.reduce((accumulator, measure) => {
    if (measure.period === "MONTHLY") {
      return accumulator + measure.targetValue;
    }

    const effectiveWeekStarts = getEffectiveWeekStarts(measure, weekStarts);
    return accumulator + measure.targetValue * effectiveWeekStarts.length;
  }, 0);
  const achievementRate =
    total > 0 ? Number(((achieved / total) * 100).toFixed(1)) : 0;

  return {
    achieved,
    total,
    achievementRate,
    isWinning: achievementRate >= 80,
  };
}

function isMonthlySummaryMeasure(
  measure: LeadMeasureSummaryRecord,
): measure is LeadMeasureSummaryRecord & {
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  trackingMode: "BOOLEAN" | "COUNT";
  dailyTargetCount: number;
} {
  return (
    measure.period === "DAILY" ||
    measure.period === "WEEKLY" ||
    measure.period === "MONTHLY"
  );
}

function getValidatedUpsertCount(
  measure: Pick<LeadMeasureRecord, "trackingMode">,
  input: DailyLogUpsertInput,
) {
  if (getTrackingMode(measure) === "COUNT") {
    if (!("count" in input)) {
      throw new BadRequestError("VALIDATION_ERROR", {
        value: ["횟수형 액션 아이템에는 count를 입력해야 합니다."],
      });
    }

    return input.count;
  }

  if ("count" in input) {
    throw new BadRequestError("VALIDATION_ERROR", {
      count: ["완료형 액션 아이템에는 value를 입력해야 합니다."],
    });
  }

  return 1;
}

function getLogCell(
  measure: Pick<LeadMeasureRecord, "trackingMode" | "dailyTargetCount">,
  log: Pick<DailyLogRecord, "value" | "count">,
): DailyLogCell {
  if (!log.value) {
    return { value: false, count: 0, achieved: false };
  }

  const count = log.count ?? 1;
  return {
    value: true,
    count,
    achieved: isLogAchieved(measure, log),
  };
}

function isLogAchieved(
  measure: Pick<LeadMeasureRecord, "trackingMode" | "dailyTargetCount">,
  log: Pick<DailyLogRecord, "value" | "count">,
) {
  if (!log.value) {
    return false;
  }

  if (getTrackingMode(measure) !== "COUNT") {
    return true;
  }

  return (log.count ?? 1) >= getDailyTargetCount(measure);
}

function getTrackingMode(
  measure: Pick<LeadMeasureRecord, "trackingMode">,
): "BOOLEAN" | "COUNT" {
  return measure.trackingMode ?? "BOOLEAN";
}

function getDailyTargetCount(
  measure: Pick<LeadMeasureRecord, "dailyTargetCount">,
) {
  return measure.dailyTargetCount ?? 1;
}

function groupLogsByLeadMeasure(logs: DailyLogRecord[]) {
  const byLeadMeasure = new Map<number, DailyLogRecord[]>();

  for (const log of logs) {
    const measureLogs = byLeadMeasure.get(log.leadMeasureId);
    if (measureLogs) {
      measureLogs.push(log);
    } else {
      byLeadMeasure.set(log.leadMeasureId, [log]);
    }
  }

  return byLeadMeasure;
}

function getEffectiveWeekStarts(measure: { createdAt?: Date | null }, weekStarts: string[]) {
  if (!measure.createdAt) return weekStarts;
  const createdWeekStart = getWeekStart(formatDateLocal(measure.createdAt));
  return weekStarts.filter((ws) => ws >= createdWeekStart);
}

function isMeasureActiveInPeriod(measure: { status: string; createdAt?: Date | null }, periodEnd: string) {
  if (measure.status !== "ACTIVE") return false;
  if (measure.createdAt && formatDateLocal(measure.createdAt) > periodEnd) return false;
  return true;
}

function getMonthLabel(monthStart: string) {
  return `${monthStart.slice(0, 4)}.${monthStart.slice(5, 7)}`;
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
  const weekStarts = Array.from(new Set(monthDates.map((date) => getWeekStart(date))));
  if (monthDates.length === 0) return weekStarts;
  const monthStart = monthDates[0];
  const monthEnd = monthDates[monthDates.length - 1];

  return weekStarts.filter((ws) => {
    const [year, month, day] = ws.split("-").map(Number);
    const thursday = new Date(year, month - 1, day + 3);
    const thursdayStr = formatDateLocal(thursday);
    return thursdayStr >= monthStart && thursdayStr <= monthEnd;
  });
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

function getTodayInKst(referenceDate: Date = new Date()) {
  const kstDate = new Date(referenceDate.getTime() + 9 * 60 * 60 * 1000);
  return `${kstDate.getUTCFullYear()}-${pad2(kstDate.getUTCMonth() + 1)}-${pad2(
    kstDate.getUTCDate(),
  )}`;
}
