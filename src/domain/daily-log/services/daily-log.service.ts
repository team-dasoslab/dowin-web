import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import { WorkspaceLookupPort } from "@/domain/scoreboard/services/scoreboard.service";
import { DailyLogRecord, DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureRecord } from "@/domain/lead-measure/storage/lead-measure.storage";

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
  ): Promise<LeadMeasureRecord[]>;
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
  ) {}

  async upsertLog(
    leadMeasureId: number,
    userId: number,
    date: string,
    value: boolean,
  ): Promise<DailyLogRecord> {
    const measure = await this.getOwnedLeadMeasure(leadMeasureId, userId);

    if (measure.status === "ARCHIVED") {
      throw new ForbiddenError("LEAD_MEASURE_ARCHIVED");
    }

    if (date > new Date().toISOString().slice(0, 10)) {
      throw new BadRequestError("FUTURE_DATE_NOT_ALLOWED");
    }

    return await this.dailyLogStorage.upsertLog(leadMeasureId, date, value);
  }

  async deleteLog(leadMeasureId: number, userId: number, date: string): Promise<void> {
    await this.getOwnedLeadMeasure(leadMeasureId, userId);
    await this.dailyLogStorage.deleteLog(leadMeasureId, date);
  }

  async getWeeklyLogs(
    scoreboardId: number,
    userId: number,
    weekStart?: string,
  ): Promise<{
    weekStart: string;
    weekEnd: string;
    leadMeasures: Array<{
      id: number;
      name: string;
      targetValue: number;
      logs: Record<string, boolean | null>;
      achieved: number;
      achievementRate: number;
    }>;
  }> {
    const scoreboard = await this.getOwnedScoreboard(scoreboardId, userId);
    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    const normalizedWeekStart = weekStart ?? getCurrentWeekStart();
    const weekDates = getWeekDates(normalizedWeekStart);
    const weekEnd = weekDates[6];
    const measures = await this.leadMeasureStorage.findLeadMeasuresByScoreboard(
      scoreboardId,
      "active",
    );
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      measures.map((measure) => measure.id),
      normalizedWeekStart,
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
          logMap[log.logDate] = log.value;
        }

        const achieved = measureLogs.filter((log) => log.value).length;
        return {
          id: measure.id,
          name: measure.name,
          targetValue: measure.targetValue,
          logs: logMap,
          achieved,
          achievementRate:
            measure.targetValue > 0
              ? Number(((achieved / measure.targetValue) * 100).toFixed(1))
              : 0,
        };
      }),
    };
  }

  private async getOwnedScoreboard(scoreboardId: number, userId: number) {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    return await this.scoreboardStorage.findOwnedScoreboard(
      scoreboardId,
      userId,
      workspace.id,
    );
  }

  private async getOwnedLeadMeasure(leadMeasureId: number, userId: number) {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const measure = await this.leadMeasureStorage.findOwnedLeadMeasure(
      leadMeasureId,
      userId,
      workspace.id,
    );
    if (!measure || !measure.scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    return measure;
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
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}
