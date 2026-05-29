import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/server/errors";
import { ScoreboardStoragePort, WorkspaceLookupPort } from "@/domain/scoreboard/services/scoreboard.service";
import { assertWorkspaceOperationAllowed } from "@/domain/workspace/plan-limits";
import {
  CreateLeadMeasureInput,
  LeadMeasureRecordWithTags,
  LeadMeasureTagRecord,
  LeadMeasureStorage,
  LeadMeasureWithScoreboard,
  UpdateLeadMeasureInput,
} from "@/domain/lead-measure/storage/lead-measure.storage";

type DailyLogSummaryPort = {
  countLogsByLeadMeasure(leadMeasureId: number): Promise<number>;
  countTrueLogsByLeadMeasures(
    leadMeasureIds: number[],
    weekStart: string,
    weekEnd: string,
  ): Promise<Record<number, number>>;
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
    private workspaceStorage: WorkspaceLookupPort,
    private scoreboardStorage: Pick<ScoreboardStoragePort, "findOwnedScoreboard">,
    private leadMeasureStorage: LeadMeasureStoragePort,
    private dailyLogStorage: DailyLogSummaryPort,
  ) {}

  async getLeadMeasures(
    workspaceUid: string,
    scoreboardId: number,
    userId: number,
    status: "active" | "all",
  ): Promise<Array<LeadMeasureRecordWithTags & { weeklyAchievement: { achieved: number; total: number } }>> {
    await this.getOwnedScoreboard(workspaceUid, scoreboardId, userId);
    const measures = await this.leadMeasureStorage.findLeadMeasuresByScoreboard(
      scoreboardId,
      status,
    );
    const { weekStart, weekEnd } = getCurrentWeekRange();
    const counts = await this.dailyLogStorage.countTrueLogsByLeadMeasures(
      measures.map((measure) => measure.id),
      weekStart,
      weekEnd,
    );

    return measures.map((measure) => ({
      ...measure,
      weeklyAchievement: {
        achieved: counts[measure.id] ?? 0,
        total: measure.targetValue,
      },
    }));
  }

  async createLeadMeasure(
    workspaceUid: string,
    scoreboardId: number,
    userId: number,
    input: Omit<CreateLeadMeasureInput, "scoreboardId">,
  ): Promise<LeadMeasureRecordWithTags> {
    const scoreboard = await this.getOwnedScoreboard(workspaceUid, scoreboardId, userId);
    const workspace = await this.getWorkspace(workspaceUid, userId);
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);

    if (scoreboard.status === "ARCHIVED") {
      throw new ForbiddenError("SCOREBOARD_ARCHIVED");
    }

    validateTargetValue(input.targetValue, input.period, scoreboard.startDate);
    await this.assertWorkspaceTagOwnership(scoreboard.workspaceId, input.tagIds ?? []);

    return await this.leadMeasureStorage.createLeadMeasure({
      ...input,
      scoreboardId,
    });
  }

  async updateLeadMeasure(
    workspaceUid: string,
    id: number,
    userId: number,
    input: UpdateLeadMeasureInput,
  ): Promise<LeadMeasureRecordWithTags> {
    const measure = await this.getOwnedLeadMeasure(workspaceUid, id, userId);
    const workspace = await this.getWorkspace(workspaceUid, userId);
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);

    if (measure.status === "ARCHIVED") {
      throw new ForbiddenError("LEAD_MEASURE_ARCHIVED");
    }

    validateTargetValue(
      input.targetValue ?? measure.targetValue,
      input.period ?? measure.period,
      measure.scoreboard.startDate,
    );
    await this.assertWorkspaceTagOwnership(
      measure.scoreboard.workspaceId,
      input.tagIds ?? [],
      input.tagIds !== undefined,
    );

    return await this.leadMeasureStorage.updateLeadMeasure(id, input);
  }

  async archiveLeadMeasure(workspaceUid: string, id: number, userId: number): Promise<LeadMeasureRecordWithTags> {
    const measure = await this.getOwnedLeadMeasure(workspaceUid, id, userId);
    const workspace = await this.getWorkspace(workspaceUid, userId);
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);

    if (measure.status === "ARCHIVED") {
      throw new BadRequestError("LEAD_MEASURE_ALREADY_ARCHIVED");
    }

    return await this.leadMeasureStorage.archiveLeadMeasure(id);
  }

  async reactivateLeadMeasure(workspaceUid: string, id: number, userId: number): Promise<LeadMeasureRecordWithTags> {
    const measure = await this.getOwnedLeadMeasure(workspaceUid, id, userId);
    const workspace = await this.getWorkspace(workspaceUid, userId);
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);

    if (measure.status === "ACTIVE") {
      throw new BadRequestError("LEAD_MEASURE_ALREADY_ACTIVE");
    }

    return await this.leadMeasureStorage.reactivateLeadMeasure(id);
  }

  async deleteLeadMeasure(
    workspaceUid: string,
    id: number,
    userId: number,
  ): Promise<{ warning: string; deleted: boolean }> {
    const measure = await this.getOwnedLeadMeasure(workspaceUid, id, userId);
    const workspace = await this.getWorkspace(workspaceUid, userId);
    await assertWorkspaceOperationAllowed(workspace, this.workspaceStorage);

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

  private async getOwnedScoreboard(workspaceUid: string, scoreboardId: number, userId: number) {
    const workspace = await this.getWorkspace(workspaceUid, userId);

    const scoreboard = await this.scoreboardStorage.findOwnedScoreboard(
      scoreboardId,
      userId,
      workspace.id,
    );
    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    return scoreboard;
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

  private async getOwnedLeadMeasure(
    workspaceUid: string,
    id: number,
    userId: number,
  ): Promise<LeadMeasureWithScoreboard> {
    const workspace = await this.getWorkspace(workspaceUid, userId);

    const measure = await this.leadMeasureStorage.findOwnedLeadMeasure(
      id,
      userId,
      workspace.id,
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

function getDaysInMonthFromIsoDate(isoDate: string) {
  const [yearText, monthText] = isoDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return 31;
  }

  return new Date(year, month, 0).getDate();
}
