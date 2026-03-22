import { NotFoundError } from "@/lib/server/errors";

type WorkspaceLookupPort = {
  findUserWorkspace(userId: number): Promise<{ id: number; name: string } | null>;
  findMembers(workspaceId: number): Promise<
    Array<{
      userId: number;
      role: "ADMIN" | "MEMBER";
      user?: { nickname?: string | null; avatarKey?: string | null } | null;
    }>
  >;
};

type TeamScoreboard = {
  id: number;
  userId: number;
  goalName: string;
  lagMeasure: string;
  status: "ACTIVE" | "ARCHIVED";
  leadMeasures: Array<{
    id: number;
    name: string;
    targetValue: number;
    period: "DAILY" | "WEEKLY" | "MONTHLY";
    status: "ACTIVE" | "ARCHIVED";
  }>;
};

type ScoreboardLookupPort = {
  findActiveScoreboardsByWorkspace(workspaceId: number): Promise<TeamScoreboard[]>;
};

type DailyLogLookupPort = {
  findLogsForLeadMeasures(
    leadMeasureIds: number[],
    rangeStart: string,
    rangeEnd: string,
  ): Promise<Array<{ leadMeasureId: number; logDate: string; value: boolean }>>;
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export class DashboardService {
  constructor(
    private workspaceStorage: WorkspaceLookupPort,
    private scoreboardStorage: ScoreboardLookupPort,
    private dailyLogStorage: DailyLogLookupPort,
  ) {}

  async getTeamDashboard(userId: number, weekStart?: string) {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const normalizedWeekStart = weekStart ?? getCurrentWeekStart();
    const weekDates = getWeekDates(normalizedWeekStart);
    const weekEnd = weekDates[6];
    const normalizedMonthStart = normalizeMonthStart(normalizedWeekStart);
    const monthDates = getMonthDates(normalizedMonthStart);
    const monthEnd = monthDates[monthDates.length - 1];
    const members = await this.workspaceStorage.findMembers(workspace.id);
    const sortedMembers = [...members].sort((a, b) => {
      const aPriority = a.userId === userId ? 0 : 1;
      const bPriority = b.userId === userId ? 0 : 1;
      return aPriority - bPriority;
    });
    const scoreboards = await this.scoreboardStorage.findActiveScoreboardsByWorkspace(
      workspace.id,
    );
    const allLeadMeasureIds = scoreboards.flatMap((scoreboard) =>
      scoreboard.leadMeasures
        .filter((leadMeasure) => leadMeasure.status === "ACTIVE")
        .map((leadMeasure) => leadMeasure.id),
    );
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      allLeadMeasureIds,
      normalizedWeekStart < normalizedMonthStart
        ? normalizedWeekStart
        : normalizedMonthStart,
      weekEnd > monthEnd ? weekEnd : monthEnd,
    );
    const logsByLeadMeasure = new Map<number, Array<(typeof logs)[number]>>();

    for (const log of logs) {
      logsByLeadMeasure.set(log.leadMeasureId, [
        ...(logsByLeadMeasure.get(log.leadMeasureId) ?? []),
        log,
      ]);
    }

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
          .filter((leadMeasure) => leadMeasure.status === "ACTIVE")
          .map((leadMeasure) => {
            const logMap = Object.fromEntries(
              weekDates.map((date) => [date, null as boolean | null]),
            );
            const measureLogs = logsByLeadMeasure.get(leadMeasure.id) ?? [];

            for (const log of measureLogs) {
              logMap[log.logDate] = log.value;
            }

            const achieved = measureLogs.filter((log) => log.value).length;
            const achievementRate = getAchievementRate(
              achieved,
              leadMeasure.targetValue,
            );

            return {
              id: leadMeasure.id,
              name: leadMeasure.name,
              targetValue: leadMeasure.targetValue,
              period: leadMeasure.period,
              achieved,
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
            (log) =>
              log.value &&
              log.logDate >= normalizedMonthStart &&
              log.logDate <= monthEnd,
          );

          if (leadMeasure.period === "MONTHLY") {
            return sum + Math.min(truthyLogs.length, leadMeasure.targetValue);
          }

          const weeklyAchieved = weekStartsInMonth.reduce((weekSum, monthWeekStart) => {
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

          return sum + leadMeasure.targetValue * weekStartsInMonth.length;
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
            achieved: leadMeasure.achieved,
            achievementRate: leadMeasure.achievementRate,
            logs: leadMeasure.logs,
          })),
        };
      }),
    };
  }
}

function getAchievementRate(achieved: number, targetValue: number) {
  if (targetValue <= 0) {
    return 0;
  }

  return Number(((Math.min(achieved, targetValue) / targetValue) * 100).toFixed(1));
}

function getCurrentWeekStart() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
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
  return [...new Set(monthDates.map((date) => getWeekStart(date)))];
}

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
