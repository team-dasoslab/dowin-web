import {
  assertWorkspaceOperationAllowed,
  getPlanMemberLimit,
  getWorkspaceMemberCapacity,
} from "@/domain/workspace/plan-limits";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";
import { type NullableEntitlementSource } from "@/domain/billing/types";

type WorkspaceLookupPort = {
  findMembers(workspaceId: number): Promise<
    Array<{
      userId: number;
      role: "ADMIN" | "MEMBER";
      user?: { nickname?: string | null; avatarKey?: string | null } | null;
    }>
  >;
  countMembers(workspaceId: number): Promise<number>;
  findSeatEntitlement?(
    workspaceId: number,
  ): Promise<{ purchasedSeatCount: number } | null>;
  findBillingState(workspaceId: number): Promise<{
    planCode: "BASIC" | "FREE" | "STANDARD";
    billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
    entitlementSource: NullableEntitlementSource;
  } | null>;
  findPlanLimit(
    planCode: "BASIC" | "FREE" | "STANDARD",
  ): Promise<{ memberLimit: number } | null>;
};

type TeamScoreboard = {
  id: number;
  userId: number;
  goalName: string;
  lagMeasure: string;
  startDate?: string;
  endDate?: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt?: Date;
  leadMeasures: Array<{
    id: number;
    scoreboardId?: number;
    name: string;
    targetValue: number;
    period: "DAILY" | "WEEKLY" | "MONTHLY";
    trackingMode: "BOOLEAN" | "COUNT";
    dailyTargetCount: number;
    status: "ACTIVE" | "ARCHIVED";
    createdAt?: Date;
    archivedAt?: Date | null;
    tags: Array<{ id: number; name: string }>;
  }>;
};

type ScoreboardLookupPort = {
  findActiveScoreboardsByWorkspace(workspaceId: number): Promise<TeamScoreboard[]>;
  findActiveScoreboard?(
    userId: number,
    workspaceId: number,
  ): Promise<TeamScoreboard | undefined>;
};

type DailyLogLookupPort = {
  findLogsForLeadMeasures(
    leadMeasureIds: number[],
    rangeStart: string,
    rangeEnd: string,
  ): Promise<Array<{ leadMeasureId: number; logDate: string; value: boolean; count?: number }>>;
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
type WorkspaceLookup = { id: number; name: string; planCode?: string };
type WorkspaceMemberLookup = Awaited<
  ReturnType<WorkspaceLookupPort["findMembers"]>
>[number];
type DailyLogLookup = Awaited<
  ReturnType<DailyLogLookupPort["findLogsForLeadMeasures"]>
>[number];
type DailyLogCell = {
  value: boolean;
  count: number;
  achieved: boolean;
};

export class DashboardService {
  constructor(
    private workspaceStorage: WorkspaceLookupPort,
    private scoreboardStorage: ScoreboardLookupPort,
    private dailyLogStorage: DailyLogLookupPort,
  ) { }

  async getTeamDashboard(context: WorkspaceAccessContext, weekStart?: string) {
    await assertWorkspaceOperationAllowed(
      { id: context.workspaceId, planCode: context.entitlement.planCode },
      this.workspaceStorage,
    );
    const normalizedWeekStart = weekStart ?? getCurrentWeekStart();

    const members = await this.workspaceStorage.findMembers(context.workspaceId);
    const scoreboards = await this.scoreboardStorage.findActiveScoreboardsByWorkspace(
      context.workspaceId,
    );
    const allLeadMeasureIds = getActiveLeadMeasureIds(scoreboards);
    const logRange = getDashboardLogRange(normalizedWeekStart);
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      allLeadMeasureIds,
      logRange.start,
      logRange.end,
    );

    return buildTeamDashboard({
      workspace: { id: context.workspaceId, name: context.workspaceName },
      userId: context.userId,
      normalizedWeekStart,
      members,
      scoreboards,
      logs,
    });
  }

  async getMyDashboard(
    context: WorkspaceAccessContext,
    input: { weekStart?: string; monthStart?: string; view?: "week" | "month" },
  ) {
    await assertWorkspaceOperationAllowed(
      { id: context.workspaceId, planCode: context.entitlement.planCode },
      this.workspaceStorage,
    );

    const normalizedWeekStart = input.weekStart ?? getCurrentWeekStart();
    const normalizedMonthStart = normalizeMonthStart(input.monthStart ?? normalizedWeekStart);
    const selectedView = input.view ?? "week";
    if (!this.scoreboardStorage.findActiveScoreboard) {
      throw new Error("DashboardService requires findActiveScoreboard for My Dashboard");
    }

    const scoreboard = await this.scoreboardStorage.findActiveScoreboard(
      context.userId,
      context.workspaceId,
    );

    if (!scoreboard) {
      return {
        workspace: await this.buildWorkspacePayload(context),
        activeScoreboard: null,
        weeklyLogs: null,
        monthlyLogs: null,
        monthlySummary: null,
        weeklyTrendPoints: [],
      };
    }

    const activeLeadMeasures = scoreboard.leadMeasures.filter(
      (leadMeasure) => leadMeasure.status === "ACTIVE",
    );
    const leadMeasureIds = activeLeadMeasures.map((leadMeasure) => leadMeasure.id);
    const weekDates = getWeekDates(normalizedWeekStart);
    const weeklyFetchStart = addDays(normalizedWeekStart, -21);
    const weeklyFetchEnd = weekDates[6];
    const monthDates = getMonthDates(normalizedMonthStart);
    const monthWeekStarts = getWeekStartsInMonth(monthDates);
    const monthlyFetchStart = monthWeekStarts[0] ?? normalizedMonthStart;
    const monthlyFetchEnd = addDays(
      monthWeekStarts[monthWeekStarts.length - 1] ?? normalizedMonthStart,
      6,
    );
    const fetchStart =
      weeklyFetchStart < monthlyFetchStart ? weeklyFetchStart : monthlyFetchStart;
    const fetchEnd = weeklyFetchEnd > monthlyFetchEnd ? weeklyFetchEnd : monthlyFetchEnd;
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      leadMeasureIds,
      fetchStart,
      fetchEnd,
    );
    const weeklyLogs = buildMyWeeklyLogs({
      logs,
      scoreboard,
      weekStart: normalizedWeekStart,
    });
    const monthlySummary = buildMyMonthlySummary({
      logs,
      monthStart: normalizedMonthStart,
      scoreboard,
    });
    const monthlyLogs =
      selectedView === "month"
        ? buildMyMonthlyLogs({
          logs,
          monthStart: normalizedMonthStart,
          scoreboard,
        })
        : null;
    const trendWeekStarts = [-21, -14, -7, 0].map((offset) =>
      addDays(normalizedWeekStart, offset),
    );
    const weeklyTrendPoints = trendWeekStarts.map((trendWeekStart) => ({
      label: trendWeekStart.slice(5).replace("-", "."),
      rate: getMyWeeklyRate({
        activeLeadMeasures,
        logs,
        weekStart: trendWeekStart,
      }),
      weekStart: trendWeekStart,
    }));

    return {
      workspace: await this.buildWorkspacePayload(context),
      activeScoreboard: scoreboard,
      weeklyLogs,
      monthlyLogs,
      monthlySummary,
      weeklyTrendPoints,
    };
  }

  async getTeamWeeklyReport(context: WorkspaceAccessContext, weekStart?: string, weeks = 5) {
    await assertWorkspaceOperationAllowed(
      { id: context.workspaceId, planCode: context.entitlement.planCode },
      this.workspaceStorage,
    );
    const normalizedWeekStart = weekStart ?? getCurrentWeekStart();
    const boundedWeeks = Math.min(Math.max(weeks, 1), 12);
    const trendWeekStarts = getPreviousWeekStarts(
      normalizedWeekStart,
      boundedWeeks,
    );
    const earliestWeekStart = trendWeekStarts[0] ?? normalizedWeekStart;

    const members = await this.workspaceStorage.findMembers(context.workspaceId);
    const scoreboards = await this.scoreboardStorage.findActiveScoreboardsByWorkspace(
      context.workspaceId,
    );
    const allLeadMeasureIds = getActiveLeadMeasureIds(scoreboards);
    const currentDashboardLogRange = getDashboardLogRange(normalizedWeekStart);
    const trendEnd = getWeekDates(normalizedWeekStart)[6];
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      allLeadMeasureIds,
      earliestWeekStart < currentDashboardLogRange.start
        ? earliestWeekStart
        : currentDashboardLogRange.start,
      trendEnd > currentDashboardLogRange.end
        ? trendEnd
        : currentDashboardLogRange.end,
    );
    const dashboard = buildTeamDashboard({
      workspace: { id: context.workspaceId, name: context.workspaceName },
      userId: context.userId,
      normalizedWeekStart,
      members,
      scoreboards,
      logs,
    });
    const trends = trendWeekStarts.map((trendWeekStart) =>
      buildWeeklyTrend({
        weekStart: trendWeekStart,
        members,
        scoreboards,
        logs,
      }),
    );

    return {
      ...dashboard,
      trends,
    };
  }

  async getTeamTrend(context: WorkspaceAccessContext, weekStart?: string, weeks = 5) {
    await assertWorkspaceOperationAllowed(
      { id: context.workspaceId, planCode: context.entitlement.planCode },
      this.workspaceStorage,
    );
    const normalizedWeekStart = weekStart ?? getCurrentWeekStart();
    const boundedWeeks = Math.min(Math.max(weeks, 1), 12);
    const trendWeekStarts = getPreviousWeekStarts(
      normalizedWeekStart,
      boundedWeeks,
    );
    const earliestWeekStart = trendWeekStarts[0] ?? normalizedWeekStart;

    const members = await this.workspaceStorage.findMembers(context.workspaceId);
    const scoreboards = await this.scoreboardStorage.findActiveScoreboardsByWorkspace(
      context.workspaceId,
    );
    const allLeadMeasureIds = getActiveLeadMeasureIds(scoreboards);
    const trendEnd = getWeekDates(normalizedWeekStart)[6];
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      allLeadMeasureIds,
      earliestWeekStart,
      trendEnd,
    );
    const trends = trendWeekStarts.map((trendWeekStart) =>
      buildWeeklyTrend({
        weekStart: trendWeekStart,
        members,
        scoreboards,
        logs,
      }),
    );

    return { trends };
  }

  private async buildWorkspacePayload(context: WorkspaceAccessContext) {
    const memberCapacity = await getWorkspaceMemberCapacity(
      { id: context.workspaceId, planCode: context.entitlement.planCode },
      this.workspaceStorage,
    );
    const fallbackFreeMemberLimit = await getPlanMemberLimit(
      "FREE",
      this.workspaceStorage,
    );
    const memberLimit =
      memberCapacity.memberLimit ?? fallbackFreeMemberLimit ?? 10;

    return {
      id: context.workspacePublicId,
      name: context.workspaceName,
      planCode: context.entitlement.planCode,
      role: context.role,
      memberCount: memberCapacity.memberCount,
      freeMemberLimit: memberLimit,
      isOverFreeMemberLimit: memberCapacity.memberCount > memberLimit,
      allowPastDailyLogEdit: context.allowPastDailyLogEdit,
    };
  }
}

function buildMyWeeklyLogs({
  logs,
  scoreboard,
  weekStart,
}: {
  logs: DailyLogLookup[];
  scoreboard: TeamScoreboard;
  weekStart: string;
}) {
  const weekDates = getWeekDates(weekStart);
  const weekEnd = weekDates[6];
  const previousWeekStart = addDays(weekStart, -7);
  const logsByLeadMeasure = buildLogsByLeadMeasure(logs);
  const shouldIncludeGuide = weekStart === getCurrentWeekStart();

  return {
    weekStart,
    weekEnd,
    leadMeasures: scoreboard.leadMeasures
      .filter((measure) => isMeasureActiveInPeriod(measure, weekEnd))
      .map((measure) => {
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

          if (log.logDate >= weekStart && log.logDate <= weekEnd) {
            achieved += 1;
            continue;
          }

          if (log.logDate >= previousWeekStart && log.logDate < weekStart) {
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
          tags: measure.tags,
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

function buildMyMonthlyLogs({
  logs,
  monthStart,
  scoreboard,
}: {
  logs: DailyLogLookup[];
  monthStart: string;
  scoreboard: TeamScoreboard;
}) {
  const monthDates = getMonthDates(monthStart);
  const monthEnd = monthDates[monthDates.length - 1];
  const logsByLeadMeasure = buildLogsByLeadMeasure(logs);
  const leadMeasures = scoreboard.leadMeasures
    .filter((measure) => isMeasureActiveInPeriod(measure, monthEnd))
    .map((measure) => {
      const measureLogs = logsByLeadMeasure.get(measure.id) ?? [];
      const logMap = Object.fromEntries(
        monthDates.map((date) => [date, null as DailyLogCell | null]),
      );
      let achieved = 0;

      for (const log of measureLogs) {
        if (log.logDate < monthStart || log.logDate > monthEnd) {
          continue;
        }

        logMap[log.logDate] = getLogCell(measure, log);
        if (isLogAchieved(measure, log)) {
          achieved += 1;
        }
      }

      return {
        id: measure.id,
        name: measure.name,
        period: measure.period,
        targetValue: measure.targetValue,
        trackingMode: getTrackingMode(measure),
        dailyTargetCount: getDailyTargetCount(measure),
        tags: measure.tags,
        logs: logMap,
        achieved,
        total: measure.targetValue,
        achievementRate: getAchievementRate(achieved, measure.targetValue),
      };
    });

  return {
    monthStart,
    monthEnd,
    monthLabel: getMonthLabel(monthStart),
    summary: calculateMyMonthlySummary({
      logs,
      measures: scoreboard.leadMeasures.filter((measure) =>
        isMeasureActiveInPeriod(measure, monthEnd),
      ),
      monthEnd,
      monthStart,
      weekStarts: getWeekStartsInMonth(monthDates),
    }),
    leadMeasures,
  };
}

function buildMyMonthlySummary({
  logs,
  monthStart,
  scoreboard,
}: {
  logs: DailyLogLookup[];
  monthStart: string;
  scoreboard: TeamScoreboard;
}) {
  const monthDates = getMonthDates(monthStart);
  const monthEnd = monthDates[monthDates.length - 1];

  return {
    monthStart,
    monthEnd,
    monthLabel: getMonthLabel(monthStart),
    summary: calculateMyMonthlySummary({
      logs,
      measures: scoreboard.leadMeasures.filter((measure) =>
        isMeasureActiveInPeriod(measure, monthEnd),
      ),
      monthEnd,
      monthStart,
      weekStarts: getWeekStartsInMonth(monthDates),
    }),
  };
}

function calculateMyMonthlySummary({
  logs,
  measures,
  monthEnd,
  monthStart,
  weekStarts,
}: {
  logs: DailyLogLookup[];
  measures: TeamScoreboard["leadMeasures"];
  monthEnd: string;
  monthStart: string;
  weekStarts: string[];
}) {
  const logsByLeadMeasure = buildLogsByLeadMeasure(logs);
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

function getMyWeeklyRate({
  activeLeadMeasures,
  logs,
  weekStart,
}: {
  activeLeadMeasures: TeamScoreboard["leadMeasures"];
  logs: DailyLogLookup[];
  weekStart: string;
}) {
  const weekEnd = getWeekDates(weekStart)[6];
  const logsByLeadMeasure = buildLogsByLeadMeasure(logs);
  const weeklyTargetMeasures = activeLeadMeasures.filter(
    (measure) =>
      measure.period !== "MONTHLY" &&
      isMeasureActiveInPeriod(measure, weekEnd),
  );
  const achieved = weeklyTargetMeasures.reduce((sum, measure) => {
    const measureAchieved = (logsByLeadMeasure.get(measure.id) ?? []).filter(
      (log) =>
        log.logDate >= weekStart &&
        log.logDate <= weekEnd &&
        isLogAchieved(measure, log),
    ).length;

    return sum + Math.min(measureAchieved, measure.targetValue);
  }, 0);
  const total = weeklyTargetMeasures.reduce(
    (sum, measure) => sum + measure.targetValue,
    0,
  );

  return total > 0 ? Math.round((achieved / total) * 100) : 0;
}

function buildTeamDashboard({
  workspace,
  userId,
  normalizedWeekStart,
  members,
  scoreboards,
  logs,
}: {
  workspace: WorkspaceLookup;
  userId: number;
  normalizedWeekStart: string;
  members: WorkspaceMemberLookup[];
  scoreboards: TeamScoreboard[];
  logs: DailyLogLookup[];
}) {
  const weekDates = getWeekDates(normalizedWeekStart);
  const weekEnd = weekDates[6];
  const normalizedMonthStart = normalizeMonthStart(normalizedWeekStart);
  const monthDates = getMonthDates(normalizedMonthStart);
  const monthEnd = monthDates[monthDates.length - 1];
  const sortedMembers = [...members].sort((a, b) => {
    const aPriority = a.userId === userId ? 0 : 1;
    const bPriority = b.userId === userId ? 0 : 1;
    return aPriority - bPriority;
  });
  const logsByLeadMeasure = buildLogsByLeadMeasure(logs);

  const scoreboardsByUserId = new Map(
    scoreboards.map((scoreboard) => [scoreboard.userId, scoreboard]),
  );

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    weekStart: normalizedWeekStart,
    weekEnd,
    members: sortedMembers.map((member) => {
      const scoreboard = scoreboardsByUserId.get(member.userId);

      if (!scoreboard) {
        return {
          userId: member.userId,
          nickname: member.user?.nickname ?? "이름 없음",
          avatarKey: member.user?.avatarKey ?? null,
          role: member.role,
          hasScoreboard: false,
          scoreboardId: null,
          goalName: null,
          lagMeasure: null,
          achieved: 0,
          total: 0,
          achievementRate: 0,
          weeklyAchievementRate: 0,
          monthlyAchievementRate: 0,
          isWinning: false,
          leadMeasures: [],
        };
      }

      const leadMeasures = scoreboard.leadMeasures
        .filter((leadMeasure) => isMeasureActiveInPeriod(leadMeasure, weekEnd))
        .map((leadMeasure) => {
          const logMap = Object.fromEntries(
            weekDates.map((date) => [date, null as DailyLogCell | null]),
          );
          const measureLogs = logsByLeadMeasure.get(leadMeasure.id) ?? [];
          const weeklyLogs = measureLogs.filter(
            (log) => log.logDate >= normalizedWeekStart && log.logDate <= weekEnd,
          );

          for (const log of weeklyLogs) {
            logMap[log.logDate] = getLogCell(leadMeasure, log);
          }

          const achieved = weeklyLogs.filter((log) =>
            isLogAchieved(leadMeasure, log),
          ).length;
          const achievementRate = getAchievementRate(
            achieved,
            leadMeasure.targetValue,
          );

          return {
            id: leadMeasure.id,
            name: leadMeasure.name,
            targetValue: leadMeasure.targetValue,
            period: leadMeasure.period,
            trackingMode: getTrackingMode(leadMeasure),
            dailyTargetCount: getDailyTargetCount(leadMeasure),
            tags: leadMeasure.tags,
            createdAt: leadMeasure.createdAt,
            achieved,
            total: leadMeasure.targetValue,
            achievementRate,
            logs: logMap,
          };
        });

      const weeklyLeadMeasures = leadMeasures.filter(
        (leadMeasure) => leadMeasure.period !== "MONTHLY",
      );
      const achieved = weeklyLeadMeasures.reduce(
        (sum, leadMeasure) =>
          sum + Math.min(leadMeasure.achieved, leadMeasure.targetValue),
        0,
      );
      const total = weeklyLeadMeasures.reduce(
        (sum, leadMeasure) => sum + leadMeasure.targetValue,
        0,
      );
      const achievementRate = total > 0 ? Math.round((achieved / total) * 100) : 0;
      const monthlyMeasures = leadMeasures.filter(
        (leadMeasure) => leadMeasure.period === "WEEKLY" || leadMeasure.period === "MONTHLY",
      );
      const weekStartsInMonth = getWeekStartsInMonth(monthDates);
      const monthlyAchieved = monthlyMeasures.reduce((sum, leadMeasure) => {
        const truthyLogs = (logsByLeadMeasure.get(leadMeasure.id) ?? []).filter(
          (log) => isLogAchieved(leadMeasure, log)
        );

        if (leadMeasure.period === "MONTHLY") {
          const monthlyLogsCount = truthyLogs.filter(
            (log) => log.logDate >= normalizedMonthStart && log.logDate <= monthEnd
          ).length;
          return sum + Math.min(monthlyLogsCount, leadMeasure.targetValue);
        }

        const effectiveWeekStarts = getEffectiveWeekStarts(leadMeasure, weekStartsInMonth);
        const weeklyAchieved = effectiveWeekStarts.reduce((weekSum, monthWeekStart) => {
          const weekTrueCount = truthyLogs.filter(
            (log) => getWeekStart(log.logDate) === monthWeekStart,
          ).length;

          return weekSum + Math.min(weekTrueCount, leadMeasure.targetValue);
        }, 0);

        return sum + weeklyAchieved;
      }, 0);
      const monthlyTotal = monthlyMeasures.reduce((sum, leadMeasure) => {
        if (leadMeasure.period === "MONTHLY") {
          return sum + leadMeasure.targetValue;
        }

        const effectiveWeekStarts = getEffectiveWeekStarts(leadMeasure, weekStartsInMonth);
        return sum + leadMeasure.targetValue * effectiveWeekStarts.length;
      }, 0);
      const monthlyAchievementRate =
        monthlyTotal > 0
          ? Math.round((monthlyAchieved / monthlyTotal) * 100)
          : 0;

      return {
        userId: member.userId,
        nickname: member.user?.nickname ?? "이름 없음",
        avatarKey: member.user?.avatarKey ?? null,
        role: member.role,
        hasScoreboard: true,
        scoreboardId: scoreboard.id,
        goalName: scoreboard.goalName,
        lagMeasure: scoreboard.lagMeasure,
        achieved,
        total,
        achievementRate,
        weeklyAchievementRate: achievementRate,
        monthlyAchievementRate,
        isWinning: achievementRate >= 80,
        leadMeasures: leadMeasures.map((leadMeasure) => ({
          id: leadMeasure.id,
          name: leadMeasure.name,
          period: leadMeasure.period,
          targetValue: leadMeasure.targetValue,
          trackingMode: leadMeasure.trackingMode,
          dailyTargetCount: leadMeasure.dailyTargetCount,
          tags: leadMeasure.tags,
          achieved: leadMeasure.achieved,
          total: leadMeasure.total,
          achievementRate: leadMeasure.achievementRate,
          logs: leadMeasure.logs,
        })),
      };
    }),
  };
}

function buildWeeklyTrend({
  weekStart,
  members,
  scoreboards,
  logs,
}: {
  weekStart: string;
  members: WorkspaceMemberLookup[];
  scoreboards: TeamScoreboard[];
  logs: DailyLogLookup[];
}) {
  const weekDates = getWeekDates(weekStart);
  const weekEnd = weekDates[6];
  const scoreboardsByUserId = new Map(
    scoreboards.map((scoreboard) => [scoreboard.userId, scoreboard]),
  );
  const logsByLeadMeasure = buildLogsByLeadMeasure(logs);
  let activeCount = 0;
  let winningCount = 0;
  let startedCount = 0;

  for (const member of members) {
    const scoreboard = scoreboardsByUserId.get(member.userId);
    if (!scoreboard) continue;

    const weeklyLeadMeasures = scoreboard.leadMeasures.filter(
      (leadMeasure) =>
        leadMeasure.period !== "MONTHLY" &&
        isMeasureActiveInPeriod(leadMeasure, weekEnd),
    );
    const achieved = weeklyLeadMeasures.reduce((sum, leadMeasure) => {
      const truthyLogCount = (logsByLeadMeasure.get(leadMeasure.id) ?? []).filter(
        (log) =>
          isLogAchieved(leadMeasure, log) &&
          log.logDate >= weekStart &&
          log.logDate <= weekEnd,
      ).length;

      return sum + Math.min(truthyLogCount, leadMeasure.targetValue);
    }, 0);
    const total = weeklyLeadMeasures.reduce(
      (sum, leadMeasure) => sum + leadMeasure.targetValue,
      0,
    );
    const achievementRate = total > 0 ? Math.round((achieved / total) * 100) : 0;

    activeCount += 1;
    if (achieved > 0) startedCount += 1;
    if (achievementRate >= 80) winningCount += 1;
  }

  return {
    weekStart,
    weekEnd,
    activeCount,
    totalCount: members.length,
    winningCount,
    startedCount,
    winRate: activeCount > 0 ? Math.round((winningCount / activeCount) * 100) : 0,
    executionRate:
      activeCount > 0 ? Math.round((startedCount / activeCount) * 100) : 0,
  };
}

function buildLogsByLeadMeasure(logs: DailyLogLookup[]) {
  const logsByLeadMeasure = new Map<number, DailyLogLookup[]>();

  for (const log of logs) {
    logsByLeadMeasure.set(log.leadMeasureId, [
      ...(logsByLeadMeasure.get(log.leadMeasureId) ?? []),
      log,
    ]);
  }

  return logsByLeadMeasure;
}

function getLogCell(
  measure: Pick<TeamScoreboard["leadMeasures"][number], "trackingMode" | "dailyTargetCount">,
  log: DailyLogLookup,
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
  measure: Pick<TeamScoreboard["leadMeasures"][number], "trackingMode" | "dailyTargetCount">,
  log: Pick<DailyLogLookup, "value" | "count">,
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
  measure: Pick<TeamScoreboard["leadMeasures"][number], "trackingMode">,
): "BOOLEAN" | "COUNT" {
  return measure.trackingMode ?? "BOOLEAN";
}

function getDailyTargetCount(
  measure: Pick<TeamScoreboard["leadMeasures"][number], "dailyTargetCount">,
) {
  return measure.dailyTargetCount ?? 1;
}

function getActiveLeadMeasureIds(scoreboards: TeamScoreboard[]) {
  return scoreboards.flatMap((scoreboard) =>
    scoreboard.leadMeasures
      .filter((leadMeasure) => leadMeasure.status === "ACTIVE")
      .map((leadMeasure) => leadMeasure.id),
  );
}

function getDashboardLogRange(weekStart: string) {
  const weekDates = getWeekDates(weekStart);
  const weekEnd = weekDates[6];
  const monthStart = normalizeMonthStart(weekStart);
  const monthDates = getMonthDates(monthStart);
  const monthEnd = monthDates[monthDates.length - 1];
  const weekStartsInMonth = getWeekStartsInMonth(monthDates);
  const monthFirstWeekStart = weekStartsInMonth[0] ?? monthStart;

  const startRange = weekStart < monthFirstWeekStart ? weekStart : monthFirstWeekStart;
  const endRange = weekEnd > monthEnd ? weekEnd : monthEnd;

  return {
    start: startRange,
    end: endRange,
  };
}

function getPreviousWeekStarts(weekStart: string, count: number) {
  const base = parseDate(weekStart);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base);
    date.setUTCDate(base.getUTCDate() - (count - index - 1) * 7);
    return formatDate(date);
  });
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
  createdAt?: Date;
  currentAchieved: number;
  period: TeamScoreboard["leadMeasures"][number]["period"];
  previousAchieved: number;
  previousWeekStart: string;
  targetValue: number;
}) {
  if (period === "MONTHLY" || targetValue <= 0 || !createdAt) {
    return null;
  }

  if (formatDate(createdAt) > previousWeekStart) {
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
  const today = new Date();
  const kstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000);
  const day = kstToday.getUTCDay();
  const diff = kstToday.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(kstToday);
  monday.setUTCDate(diff);
  return monday.toISOString().slice(0, 10);
}

function getWeekDates(weekStart: string) {
  const base = parseDate(weekStart);
  return Array.from({ length: DAY_LABELS.length }, (_, index) => {
    const date = new Date(base);
    date.setUTCDate(base.getUTCDate() + index);
    return formatDate(date);
  });
}

function addDays(dateString: string, amount: number) {
  const date = parseDate(dateString);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDate(date);
}

function normalizeMonthStart(date?: string) {
  if (!date) {
    const today = new Date();
    return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-01`;
  }

  return `${date.slice(0, 7)}-01`;
}

function getMonthDates(monthStart: string) {
  const [yearString, monthString] = monthStart.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const lastDate = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from({ length: lastDate }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, index + 1));
    return formatDate(date);
  });
}

function getWeekStart(date: string) {
  const current = parseDate(date);
  const day = current.getUTCDay();
  const diff = current.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current);
  monday.setUTCDate(diff);
  return formatDate(monday);
}

function getWeekStartsInMonth(monthDates: string[]) {
  const weekStarts = [...new Set(monthDates.map((date) => getWeekStart(date)))];
  if (monthDates.length === 0) return weekStarts;
  const monthStart = monthDates[0];
  const monthEnd = monthDates[monthDates.length - 1];

  return weekStarts.filter((ws) => {
    const thursday = parseDate(ws);
    thursday.setUTCDate(thursday.getUTCDate() + 3);
    const thursdayStr = formatDate(thursday);
    return thursdayStr >= monthStart && thursdayStr <= monthEnd;
  });
}

function getEffectiveWeekStarts(measure: { createdAt?: Date }, weekStarts: string[]) {
  if (!measure.createdAt) return weekStarts;
  const createdWeekStart = getWeekStart(formatDate(measure.createdAt));
  return weekStarts.filter((ws) => ws >= createdWeekStart);
}

function isMeasureActiveInPeriod(measure: { status: string; createdAt?: Date }, periodEnd: string) {
  if (measure.status !== "ACTIVE") return false;
  if (measure.createdAt && formatDate(measure.createdAt) > periodEnd) return false;
  return true;
}

function getMonthLabel(monthStart: string) {
  return `${monthStart.slice(0, 4)}.${monthStart.slice(5, 7)}`;
}

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
