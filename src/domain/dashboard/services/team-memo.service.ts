import { ForbiddenError, NotFoundError } from "@/lib/server/errors";
import { TeamMemoRecord } from "@/domain/dashboard/storage/team-memo.storage";
import { WorkspaceAccessContext } from "@/lib/server/workspace-context";

type WorkspacePort = {
  findMembership(
    workspaceId: number,
    userId: number,
  ): Promise<{ userId: number; role: "ADMIN" | "MEMBER" } | null>;
  countMembers(workspaceId: number): Promise<number>;
  findPlanLimit(
    planCode: "FREE" | "STANDARD",
  ): Promise<{ memberLimit: number } | null>;
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

  async listTeamMemos(context: WorkspaceAccessContext, targetUserId: number) {
    await this.requireWorkspaceMember(context.workspaceId, targetUserId);

    const memos = await this.teamMemoStorage.listByWorkspaceAndTarget(
      context.workspaceId,
      targetUserId,
    );

    return {
      workspaceId: context.workspacePublicId,
      targetUserId,
      memos: memos.map((memo) => toTeamMemoDto(memo, context.workspacePublicId)),
    };
  }

  async createTeamMemo(
    context: WorkspaceAccessContext,
    input: { targetUserId: number; content: string },
  ) {
    // FREE 플랜 제한 등은 생략하거나 나중에 추가. 일단 메모 기능 자체의 제한은 없음
    await this.requireWorkspaceMember(context.workspaceId, input.targetUserId);

    const memo = await this.teamMemoStorage.create({
      workspaceId: context.workspaceId,
      targetUserId: input.targetUserId,
      authorUserId: context.userId,
      content: input.content.trim(),
    });

    return toTeamMemoDto(memo, context.workspacePublicId);
  }

  async resolveTeamMemo(
    context: WorkspaceAccessContext,
    memoId: number,
    isResolved: boolean,
  ) {
    const memo = await this.teamMemoStorage.findById(memoId);

    if (!memo || memo.workspaceId !== context.workspaceId) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (memo.authorUserId !== context.userId && context.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }

    const updated = await this.teamMemoStorage.updateResolved({
      memoId,
      isResolved,
      resolvedByUserId: isResolved ? context.userId : null,
    });

    if (!updated) {
      throw new NotFoundError("NOT_FOUND");
    }

    return toTeamMemoDto(updated, context.workspacePublicId);
  }

  async deleteTeamMemo(context: WorkspaceAccessContext, memoId: number) {
    const memo = await this.teamMemoStorage.findById(memoId);

    if (!memo || memo.workspaceId !== context.workspaceId) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (memo.authorUserId !== context.userId) {
      throw new ForbiddenError("FORBIDDEN");
    }

    const deleted = await this.teamMemoStorage.deleteById(memoId);

    if (!deleted) {
      throw new NotFoundError("NOT_FOUND");
    }
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

function toTeamMemoDto(memo: TeamMemoRecord, workspacePublicId: string) {
  return {
    id: memo.id,
    workspaceId: workspacePublicId,
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
