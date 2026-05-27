import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  PlatformError,
} from "@/lib/server/errors";
import { assertFreePlanWithinMemberLimit } from "@/domain/workspace/plan-limits";
import {
  CreateScoreboardInput,
  ScoreboardRecord,
  ScoreboardWithLeadMeasures,
  UpdateScoreboardInput,
} from "@/domain/scoreboard/storage/scoreboard.storage";

type WorkspaceSummary = {
  id: number;
  planCode?: string;
};

export interface WorkspaceLookupPort {
  resolveIdByUid(uid: string): Promise<number | null>;
  findWorkspaceById(workspaceId: number): Promise<WorkspaceSummary | null>;
  findMembership(workspaceId: number, userId: number): Promise<unknown | null>;
  countMembers(workspaceId: number): Promise<number>;
  findPlanLimit(
    planCode: "FREE" | "STANDARD",
  ): Promise<{ memberLimit: number } | null>;
}

export interface ScoreboardStoragePort {
  findActiveScoreboard(
    userId: number,
    workspaceId: number,
  ): Promise<ScoreboardWithLeadMeasures | undefined>;
  createScoreboard(input: CreateScoreboardInput): Promise<ScoreboardRecord>;
  findOwnedScoreboard(
    id: number,
    userId: number,
    workspaceId: number,
  ): Promise<ScoreboardWithLeadMeasures | undefined>;
  updateScoreboard(
    id: number,
    input: UpdateScoreboardInput,
  ): Promise<ScoreboardRecord>;
  archiveScoreboard(id: number, endDate: string): Promise<ScoreboardRecord>;
  reactivateScoreboard(id: number): Promise<ScoreboardRecord>;
  findArchivedScoreboards(
    userId: number,
    workspaceId: number,
  ): Promise<ScoreboardRecord[]>;
}

export class ScoreboardService {
  constructor(
    private scoreboardStorage: ScoreboardStoragePort,
    private workspaceStorage: WorkspaceLookupPort,
  ) {}

  async getActiveScoreboard(workspaceUid: string, userId: number): Promise<ScoreboardWithLeadMeasures> {
    const workspace = await this.getWorkspace(workspaceUid, userId);
    const scoreboard = await this.scoreboardStorage.findActiveScoreboard(
      userId,
      workspace.id,
    );

    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    return scoreboard;
  }

  async createScoreboard(
    workspaceUid: string,
    userId: number,
    input: Omit<CreateScoreboardInput, "userId" | "workspaceId">,
  ): Promise<ScoreboardRecord> {
    const workspace = await this.getWorkspace(workspaceUid, userId);
    await assertFreePlanWithinMemberLimit(workspace, this.workspaceStorage);
    const existing = await this.scoreboardStorage.findActiveScoreboard(
      userId,
      workspace.id,
    );

    if (existing) {
      throw new ConflictError("ACTIVE_SCOREBOARD_EXISTS");
    }

    return await this.scoreboardStorage.createScoreboard({
      ...input,
      endDate: input.endDate ?? null,
      userId,
      workspaceId: workspace.id,
    });
  }

  async updateScoreboard(
    workspaceUid: string,
    id: number,
    userId: number,
    input: UpdateScoreboardInput,
  ): Promise<ScoreboardRecord> {
    const scoreboard = await this.getOwnedScoreboard(workspaceUid, id, userId);
    const workspace = await this.getWorkspace(workspaceUid, userId);
    await assertFreePlanWithinMemberLimit(workspace, this.workspaceStorage);

    if (scoreboard.status === "ARCHIVED") {
      throw new PlatformScoreboardArchivedError();
    }

    return await this.scoreboardStorage.updateScoreboard(id, input);
  }

  async archiveScoreboard(workspaceUid: string, id: number, userId: number): Promise<ScoreboardRecord> {
    const scoreboard = await this.getOwnedScoreboard(workspaceUid, id, userId);
    const workspace = await this.getWorkspace(workspaceUid, userId);
    await assertFreePlanWithinMemberLimit(workspace, this.workspaceStorage);

    if (scoreboard.status === "ARCHIVED") {
      throw new PlatformScoreboardArchivedError();
    }

    return await this.scoreboardStorage.archiveScoreboard(
      id,
      getCurrentDateString(),
    );
  }

  async getHistory(workspaceUid: string, userId: number): Promise<ScoreboardRecord[]> {
    const workspace = await this.getWorkspace(workspaceUid, userId);
    return await this.scoreboardStorage.findArchivedScoreboards(
      userId,
      workspace.id,
    );
  }

  async reactivateScoreboard(
    workspaceUid: string,
    id: number,
    userId: number,
  ): Promise<ScoreboardRecord> {
    const scoreboard = await this.getOwnedScoreboard(workspaceUid, id, userId);
    const workspace = await this.getWorkspace(workspaceUid, userId);
    await assertFreePlanWithinMemberLimit(workspace, this.workspaceStorage);

    if (scoreboard.status === "ACTIVE") {
      throw new BadRequestError("SCOREBOARD_ALREADY_ACTIVE");
    }

    const existing = await this.scoreboardStorage.findActiveScoreboard(
      userId,
      workspace.id,
    );

    if (existing) {
      throw new ConflictError("ACTIVE_SCOREBOARD_EXISTS");
    }

    return await this.scoreboardStorage.reactivateScoreboard(id);
  }

  private async getWorkspace(workspaceUid: string, userId: number): Promise<WorkspaceSummary> {
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

  private async getOwnedScoreboard(
    workspaceUid: string,
    id: number,
    userId: number,
  ): Promise<ScoreboardWithLeadMeasures> {
    const workspace = await this.getWorkspace(workspaceUid, userId);
    const scoreboard = await this.scoreboardStorage.findOwnedScoreboard(
      id,
      userId,
      workspace.id,
    );

    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    return scoreboard;
  }
}

class PlatformScoreboardArchivedError extends PlatformError {
  public readonly statusCode = 403;

  constructor() {
    super("SCOREBOARD_ARCHIVED");
  }
}

const getCurrentDateString = () => {
  return new Date().toISOString().split("T")[0];
};
