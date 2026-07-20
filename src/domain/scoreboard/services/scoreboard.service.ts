import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  PlatformError,
} from "@/lib/server/errors";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";
import {
  CreateScoreboardInput,
  ScoreboardRecord,
  ScoreboardWithLeadMeasures,
  UpdateScoreboardInput,
} from "@/domain/scoreboard/storage/scoreboard.storage";



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
  ) {}

  async getActiveScoreboard(context: WorkspaceAccessContext): Promise<ScoreboardWithLeadMeasures> {
    const scoreboard = await this.scoreboardStorage.findActiveScoreboard(
      context.userId,
      context.workspaceId,
    );

    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    return scoreboard;
  }

  async createScoreboard(
    context: WorkspaceAccessContext,
    input: Omit<CreateScoreboardInput, "userId" | "workspaceId">,
  ): Promise<ScoreboardRecord> {
    const existing = await this.scoreboardStorage.findActiveScoreboard(
      context.userId,
      context.workspaceId,
    );

    if (existing) {
      throw new ConflictError("ACTIVE_SCOREBOARD_EXISTS");
    }

    return await this.scoreboardStorage.createScoreboard({
      ...input,
      endDate: input.endDate ?? null,
      userId: context.userId,
      workspaceId: context.workspaceId,
    });
  }

  async updateScoreboard(
    context: WorkspaceAccessContext,
    id: number,
    input: UpdateScoreboardInput,
  ): Promise<ScoreboardRecord> {
    const scoreboard = await this.getOwnedScoreboard(id, context);

    if (scoreboard.status === "ARCHIVED") {
      throw new PlatformScoreboardArchivedError();
    }

    return await this.scoreboardStorage.updateScoreboard(id, input);
  }

  async archiveScoreboard(context: WorkspaceAccessContext, id: number): Promise<ScoreboardRecord> {
    const scoreboard = await this.getOwnedScoreboard(id, context);

    if (scoreboard.status === "ARCHIVED") {
      throw new PlatformScoreboardArchivedError();
    }

    return await this.scoreboardStorage.archiveScoreboard(
      id,
      getCurrentDateString(),
    );
  }

  async getHistory(context: WorkspaceAccessContext): Promise<ScoreboardRecord[]> {
    return await this.scoreboardStorage.findArchivedScoreboards(
      context.userId,
      context.workspaceId,
    );
  }

  async reactivateScoreboard(
    context: WorkspaceAccessContext,
    id: number,
  ): Promise<ScoreboardRecord> {
    const scoreboard = await this.getOwnedScoreboard(id, context);

    if (scoreboard.status === "ACTIVE") {
      throw new BadRequestError("SCOREBOARD_ALREADY_ACTIVE");
    }

    const existing = await this.scoreboardStorage.findActiveScoreboard(
      context.userId,
      context.workspaceId,
    );

    if (existing) {
      throw new ConflictError("ACTIVE_SCOREBOARD_EXISTS");
    }

    return await this.scoreboardStorage.reactivateScoreboard(id);
  }

  private async getOwnedScoreboard(
    id: number,
    context: WorkspaceAccessContext,
  ): Promise<ScoreboardWithLeadMeasures> {
    const scoreboard = await this.scoreboardStorage.findOwnedScoreboard(
      id,
      context.userId,
      context.workspaceId,
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
