import { ForbiddenError, NotFoundError } from "@/lib/server/errors";
import { TeamMemoRecord } from "@/domain/dashboard/storage/team-memo.storage";

type WorkspacePort = {
  findUserWorkspace(userId: number): Promise<{ id: number; name: string } | null>;
  findMembership(
    workspaceId: number,
    userId: number,
  ): Promise<{ userId: number; role: "ADMIN" | "MEMBER" } | null>;
};

type TeamMemoPort = {
  listByWorkspaceAndTarget(
    workspaceId: number,
    targetUserId: number,
  ): Promise<TeamMemoRecord[]>;
  create(input: {
    workspaceId: number;
    targetUserId: number;
    authorUserId: number;
    content: string;
  }): Promise<TeamMemoRecord>;
  findById(memoId: number): Promise<TeamMemoRecord | null>;
  updateResolved(input: {
    memoId: number;
    isResolved: boolean;
    resolvedByUserId: number | null;
  }): Promise<TeamMemoRecord | null>;
  deleteById(memoId: number): Promise<boolean>;
};

export class TeamMemoService {
  constructor(
    private workspaceStorage: WorkspacePort,
    private teamMemoStorage: TeamMemoPort,
  ) {}

  async listTeamMemos(userId: number, targetUserId: number) {
    const workspace = await this.getWorkspaceOrThrow(userId);
    await this.requireWorkspaceMember(workspace.id, targetUserId);

    const memos = await this.teamMemoStorage.listByWorkspaceAndTarget(
      workspace.id,
      targetUserId,
    );

    return {
      workspaceId: workspace.id,
      targetUserId,
      memos: memos.map(toTeamMemoDto),
    };
  }

  async createTeamMemo(
    userId: number,
    input: { targetUserId: number; content: string },
  ) {
    const workspace = await this.getWorkspaceOrThrow(userId);
    await this.requireWorkspaceMember(workspace.id, input.targetUserId);

    const memo = await this.teamMemoStorage.create({
      workspaceId: workspace.id,
      targetUserId: input.targetUserId,
      authorUserId: userId,
      content: input.content.trim(),
    });

    return toTeamMemoDto(memo);
  }

  async resolveTeamMemo(
    userId: number,
    memoId: number,
    isResolved: boolean,
  ) {
    const workspace = await this.getWorkspaceOrThrow(userId);
    const actorMembership = await this.requireWorkspaceMember(workspace.id, userId);
    const memo = await this.teamMemoStorage.findById(memoId);

    if (!memo || memo.workspaceId !== workspace.id) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (memo.authorUserId !== userId && actorMembership.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }

    const updated = await this.teamMemoStorage.updateResolved({
      memoId,
      isResolved,
      resolvedByUserId: isResolved ? userId : null,
    });

    if (!updated) {
      throw new NotFoundError("NOT_FOUND");
    }

    return toTeamMemoDto(updated);
  }

  async deleteTeamMemo(userId: number, memoId: number) {
    const workspace = await this.getWorkspaceOrThrow(userId);
    await this.requireWorkspaceMember(workspace.id, userId);
    const memo = await this.teamMemoStorage.findById(memoId);

    if (!memo || memo.workspaceId !== workspace.id) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (memo.authorUserId !== userId) {
      throw new ForbiddenError("FORBIDDEN");
    }

    const deleted = await this.teamMemoStorage.deleteById(memoId);

    if (!deleted) {
      throw new NotFoundError("NOT_FOUND");
    }
  }

  private async getWorkspaceOrThrow(userId: number) {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);

    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    return workspace;
  }

  private async requireWorkspaceMember(workspaceId: number, userId: number) {
    const membership = await this.workspaceStorage.findMembership(
      workspaceId,
      userId,
    );

    if (!membership) {
      throw new NotFoundError("NOT_FOUND");
    }

    return membership;
  }
}

function toTeamMemoDto(memo: TeamMemoRecord) {
  return {
    id: memo.id,
    workspaceId: memo.workspaceId,
    targetUserId: memo.targetUserId,
    author: {
      userId: memo.authorUser?.id ?? memo.authorUserId,
      nickname: memo.authorUser?.nickname ?? "이름 없음",
      avatarKey: memo.authorUser?.avatarKey ?? null,
    },
    content: memo.content,
    isResolved: memo.resolvedAt != null,
    resolvedAt: memo.resolvedAt?.toISOString() ?? null,
    resolvedByUserId: memo.resolvedByUserId,
    createdAt: memo.createdAt.toISOString(),
  };
}
