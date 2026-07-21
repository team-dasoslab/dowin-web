import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/server/errors";
import { ScoreboardStoragePort } from "@/domain/scoreboard/services/scoreboard.service";
import {
  CreateLeadMeasureInput,
  LeadMeasureRecordWithTags,
  LeadMeasureTagRecord,
  LeadMeasureStorage,
  LeadMeasureWithScoreboard,
  UpdateLeadMeasureInput,
} from "@/domain/lead-measure/storage/lead-measure.storage";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";

type DailyLogSummaryPort = {
  countLogsByLeadMeasure(leadMeasureId: number): Promise<number>;
  findLogsForLeadMeasures(
    leadMeasureIds: number[],
    weekStart: string,
    weekEnd: string,
  ): Promise<Array<{ leadMeasureId: number; logDate: string; value: boolean; count?: number }>>;
};

type LeadMeasureStoragePort = Pick<
  LeadMeasureStorage,
  | "findLeadMeasuresByScoreboard"
  | "createLeadMeasure"
  | "findOwnedLeadMeasure"
  | "updateLeadMeasure"
  | "archiveLeadMeasure"
  | "reactivateLeadMeasure"
  | "deleteLeadMeasure"
  | "findTagsByIdsInWorkspace"
>;

export class LeadMeasureService {
  constructor(
    private scoreboardStorage: Pick<ScoreboardStoragePort, "findOwnedScoreboard">,
    private leadMeasureStorage: LeadMeasureStoragePort,
    private dailyLogStorage: DailyLogSummaryPort,
  ) {}

  async getLeadMeasures(
    context: WorkspaceAccessContext,
    scoreboardId: number,
    status: "active" | "all",
  ): Promise<Array<LeadMeasureRecordWithTags & { weeklyAchievement: { achieved: number; total: number } }>> {
    await this.getOwnedScoreboard(scoreboardId, context);
    const measures = await this.leadMeasureStorage.findLeadMeasuresByScoreboard(
      scoreboardId,
      status,
    );
    const { weekStart, weekEnd } = getCurrentWeekRange();
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      measures.map((measure) => measure.id),
      weekStart,
      weekEnd,
    );
    const counts = countAchievedLogsByLeadMeasure(measures, logs);

    return measures.map((measure) => ({
      ...measure,
      weeklyAchievement: {
        achieved: counts[measure.id] ?? 0,
        total: measure.targetValue,
      },
    }));
  }

  async createLeadMeasure(
    context: WorkspaceAccessContext,
    scoreboardId: number,
    input: Omit<CreateLeadMeasureInput, "scoreboardId">,
  ): Promise<LeadMeasureRecordWithTags> {
    const scoreboard = await this.getOwnedScoreboard(scoreboardId, context);

    if (scoreboard.status === "ARCHIVED") {
      throw new ForbiddenError("SCOREBOARD_ARCHIVED");
    }

    const normalizedInput = normalizeLeadMeasureInput(input);
    validateTargetValue(normalizedInput.targetValue, normalizedInput.period, scoreboard.startDate);
    validateDailyTargetCount(normalizedInput.dailyTargetCount);
    await this.assertWorkspaceTagOwnership(context.workspaceId, input.tagIds ?? []);

    return await this.leadMeasureStorage.createLeadMeasure({
      ...normalizedInput,
      scoreboardId,
    });
  }

  async updateLeadMeasure(
    context: WorkspaceAccessContext,
    id: number,
    input: UpdateLeadMeasureInput,
  ): Promise<LeadMeasureRecordWithTags> {
    const measure = await this.getOwnedLeadMeasure(id, context);

    if (measure.status === "ARCHIVED") {
      throw new ForbiddenError("LEAD_MEASURE_ARCHIVED");
    }

    const normalizedInput = normalizeLeadMeasureUpdateInput(input, measure);
    validateTargetValue(
      normalizedInput.targetValue ?? measure.targetValue,
      normalizedInput.period ?? measure.period,
      measure.scoreboard.startDate,
    );
    validateDailyTargetCount(
      normalizedInput.dailyTargetCount ?? measure.dailyTargetCount,
    );
    await this.assertWorkspaceTagOwnership(
      context.workspaceId,
      input.tagIds ?? [],
      input.tagIds !== undefined,
    );

    return await this.leadMeasureStorage.updateLeadMeasure(id, normalizedInput);
  }

  async archiveLeadMeasure(context: WorkspaceAccessContext, id: number): Promise<LeadMeasureRecordWithTags> {
    const measure = await this.getOwnedLeadMeasure(id, context);

    if (measure.status === "ARCHIVED") {
      throw new BadRequestError("LEAD_MEASURE_ALREADY_ARCHIVED");
    }

    return await this.leadMeasureStorage.archiveLeadMeasure(id);
  }

  async reactivateLeadMeasure(context: WorkspaceAccessContext, id: number): Promise<LeadMeasureRecordWithTags> {
    const measure = await this.getOwnedLeadMeasure(id, context);

    if (measure.status === "ACTIVE") {
      throw new BadRequestError("LEAD_MEASURE_ALREADY_ACTIVE");
    }

    return await this.leadMeasureStorage.reactivateLeadMeasure(id);
  }

  async deleteLeadMeasure(
    context: WorkspaceAccessContext,
    id: number,
  ): Promise<{ warning: string; deleted: boolean }> {
    const measure = await this.getOwnedLeadMeasure(id, context);

    if (measure.status === "ARCHIVED") {
      throw new ForbiddenError("LEAD_MEASURE_ARCHIVED");
    }

    const logCount = await this.dailyLogStorage.countLogsByLeadMeasure(id);
    await this.leadMeasureStorage.deleteLeadMeasure(id);

    return {
      warning: `삭제된 기록은 복구할 수 없습니다. ${logCount}개의 기록이 함께 삭제됩니다.`,
      deleted: true,
    };
  }

  private async getOwnedScoreboard(scoreboardId: number, context: WorkspaceAccessContext) {
    const scoreboard = await this.scoreboardStorage.findOwnedScoreboard(
      scoreboardId,
      context.userId,
      context.workspaceId,
    );
    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    return scoreboard;
  }

  private async getOwnedLeadMeasure(
    id: number,
    context: WorkspaceAccessContext,
  ): Promise<LeadMeasureWithScoreboard> {
    const measure = await this.leadMeasureStorage.findOwnedLeadMeasure(
      id,
      context.userId,
      context.workspaceId,
    );
    if (!measure || !measure.scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    return measure;
  }

  private async assertWorkspaceTagOwnership(
    workspaceId: number,
    tagIds: number[],
    shouldValidateEmpty = true,
  ): Promise<LeadMeasureTagRecord[]> {
    if (!shouldValidateEmpty && tagIds.length === 0) {
      return [];
    }

    if (tagIds.length === 0) {
      return [];
    }

    const uniqueTagIds = Array.from(new Set(tagIds));
    const tags = await this.leadMeasureStorage.findTagsByIdsInWorkspace(
      workspaceId,
      uniqueTagIds,
    );

    if (tags.length !== uniqueTagIds.length) {
      throw new NotFoundError("NOT_FOUND");
    }

    return tags;
  }
}

function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const weekStartDate = new Date(today);
  weekStartDate.setDate(diff);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  return {
    weekStart: weekStartDate.toISOString().slice(0, 10),
    weekEnd: weekEndDate.toISOString().slice(0, 10),
  };
}

function validateTargetValue(
  targetValue: number,
  period: "DAILY" | "WEEKLY" | "MONTHLY",
  scoreboardStartDate: string,
) {
  if (period === "WEEKLY" && targetValue > 7) {
    throw new BadRequestError("VALIDATION_ERROR", {
      targetValue: ["주간 목표 횟수는 7회를 초과할 수 없습니다."],
    });
  }

  if (period !== "MONTHLY") {
    return;
  }

  const monthlyMax = getDaysInMonthFromIsoDate(scoreboardStartDate);
  if (targetValue > monthlyMax) {
    throw new BadRequestError("VALIDATION_ERROR", {
      targetValue: [`월간 목표 횟수는 ${monthlyMax}회를 초과할 수 없습니다.`],
    });
  }
}

function validateDailyTargetCount(dailyTargetCount: number) {
  if (dailyTargetCount > 20) {
    throw new BadRequestError("VALIDATION_ERROR", {
      dailyTargetCount: ["하루 목표 횟수는 20회를 초과할 수 없습니다."],
    });
  }
}

function normalizeLeadMeasureInput<T extends {
  trackingMode?: "BOOLEAN" | "COUNT";
  dailyTargetCount?: number;
}>(input: T): T & {
  trackingMode: "BOOLEAN" | "COUNT";
  dailyTargetCount: number;
} {
  const trackingMode = input.trackingMode ?? "BOOLEAN";
  return {
    ...input,
    trackingMode,
    dailyTargetCount:
      trackingMode === "COUNT" ? input.dailyTargetCount ?? 1 : 1,
  };
}

function normalizeLeadMeasureUpdateInput(
  input: UpdateLeadMeasureInput,
  measure: Pick<LeadMeasureWithScoreboard, "trackingMode" | "dailyTargetCount">,
): UpdateLeadMeasureInput {
  const trackingMode = input.trackingMode ?? measure.trackingMode;

  if (trackingMode === "BOOLEAN" && input.trackingMode === "BOOLEAN") {
    return { ...input, dailyTargetCount: 1 };
  }

  if (trackingMode === "COUNT" && input.dailyTargetCount === undefined) {
    return {
      ...input,
      dailyTargetCount: measure.dailyTargetCount ?? 1,
    };
  }

  return input;
}

function countAchievedLogsByLeadMeasure(
  measures: LeadMeasureRecordWithTags[],
  logs: Array<{ leadMeasureId: number; value: boolean; count?: number }>,
) {
  const measuresById = new Map(measures.map((measure) => [measure.id, measure]));

  return logs.reduce<Record<number, number>>((acc, log) => {
    if (!log.value) {
      return acc;
    }

    const measure = measuresById.get(log.leadMeasureId);
    if (!measure) {
      return acc;
    }

    const count = log.count ?? 1;
    const isAchieved =
      measure.trackingMode === "COUNT"
        ? count >= measure.dailyTargetCount
        : true;
    if (isAchieved) {
      acc[log.leadMeasureId] = (acc[log.leadMeasureId] ?? 0) + 1;
    }

    return acc;
  }, {});
}

function getDaysInMonthFromIsoDate(isoDate: string) {
  const [yearText, monthText] = isoDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return 31;
  }

  return new Date(year, month, 0).getDate();
}
