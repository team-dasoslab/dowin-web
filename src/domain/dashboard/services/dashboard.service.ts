import { NotFoundError } from "@/lib/server/errors";

type WorkspaceLookupPort = {
  findUserWorkspace(userId: number): Promise<{ id: number; name: string } | null>;
  findMembers(workspaceId: number): Promise<
    Array<{
      userId: number;
      role: "ADMIN" | "MEMBER";
      user?: { nickname?: string | null } | null;
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
    status: "ACTIVE" | "ARCHIVED";
  }>;
};

type ScoreboardLookupPort = {
  findActiveScoreboardsByWorkspace(workspaceId: number): Promise<TeamScoreboard[]>;
};

type DailyLogLookupPort = {
  findLogsForLeadMeasures(
    leadMeasureIds: number[],
    weekStart: string,
    weekEnd: string,
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
    const members = await this.workspaceStorage.findMembers(workspace.id);
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
      normalizedWeekStart,
      weekEnd,
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
      members: members.map((member) => {
        const scoreboard = scoreboardsByUserId.get(member.userId);

        if (!scoreboard) {
          return {
            userId: member.userId,
            nickname: member.user?.nickname ?? "이름 없음",
            role: member.role,
            hasScoreboard: false,
            scoreboardId: null,
            goalName: null,
            lagMeasure: null,
            achieved: 0,
            total: 0,
            achievementRate: 0,
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
            const achievementRate =
              leadMeasure.targetValue > 0
                ? Number(((achieved / leadMeasure.targetValue) * 100).toFixed(1))
                : 0;

            return {
              id: leadMeasure.id,
              name: leadMeasure.name,
              targetValue: leadMeasure.targetValue,
              achieved,
              achievementRate,
              logs: logMap,
            };
          });

        const achieved = leadMeasures.reduce(
          (sum, leadMeasure) => sum + leadMeasure.achieved,
          0,
        );
        const total = leadMeasures.reduce(
          (sum, leadMeasure) => sum + leadMeasure.targetValue,
          0,
        );
        const achievementRate =
          total > 0 ? Number(((achieved / total) * 100).toFixed(1)) : 0;

        return {
          userId: member.userId,
          nickname: member.user?.nickname ?? "이름 없음",
          role: member.role,
          hasScoreboard: true,
          scoreboardId: scoreboard.id,
          goalName: scoreboard.goalName,
          lagMeasure: scoreboard.lagMeasure,
          achieved,
          total,
          achievementRate,
          isWinning: achievementRate >= 80,
          leadMeasures,
        };
      }),
    };
  }
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
  const base = new Date(weekStart);
  return Array.from({ length: DAY_LABELS.length }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}
