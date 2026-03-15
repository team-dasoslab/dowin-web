import {
  ConflictError,
  NotFoundError,
  PlatformError,
} from "@/lib/server/errors";
import {
  CreateScoreboardInput,
  ScoreboardRecord,
  ScoreboardWithLeadMeasures,
  UpdateScoreboardInput,
} from "@/domain/scoreboard/storage/scoreboard.storage";

type WorkspaceSummary = {
  id: number;
};

export interface WorkspaceLookupPort {
  findUserWorkspace(userId: number): Promise<WorkspaceSummary | null>;
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
  archiveScoreboard(id: number): Promise<ScoreboardRecord>;
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

  async getActiveScoreboard(userId: number): Promise<ScoreboardWithLeadMeasures> {
    const workspace = await this.getWorkspace(userId);
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
    userId: number,
    input: Omit<CreateScoreboardInput, "userId" | "workspaceId">,
  ): Promise<ScoreboardRecord> {
    const workspace = await this.getWorkspace(userId);
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
    id: number,
    userId: number,
    input: UpdateScoreboardInput,
  ): Promise<ScoreboardRecord> {
    const scoreboard = await this.getOwnedScoreboard(id, userId);

    if (scoreboard.status === "ARCHIVED") {
      throw new PlatformScoreboardArchivedError();
    }

    return await this.scoreboardStorage.updateScoreboard(id, input);
  }

  async archiveScoreboard(id: number, userId: number): Promise<ScoreboardRecord> {
    const scoreboard = await this.getOwnedScoreboard(id, userId);

    if (scoreboard.status === "ARCHIVED") {
      throw new PlatformScoreboardArchivedError();
    }

    return await this.scoreboardStorage.archiveScoreboard(id);
  }

  async getHistory(userId: number): Promise<ScoreboardRecord[]> {
    const workspace = await this.getWorkspace(userId);
    return await this.scoreboardStorage.findArchivedScoreboards(
      userId,
      workspace.id,
    );
  }

  private async getWorkspace(userId: number): Promise<WorkspaceSummary> {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);

    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    return workspace;
  }

  private async getOwnedScoreboard(
    id: number,
    userId: number,
  ): Promise<ScoreboardWithLeadMeasures> {
    const workspace = await this.getWorkspace(userId);
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
