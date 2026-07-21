import { type BillingPlanCode } from "@/domain/billing/types";
import { TeamMemoRecord } from "@/domain/dashboard/storage/team-memo.storage";
import { type WorkspaceRole } from "@/domain/workspace/types";
import { ForbiddenError, NotFoundError } from "@/lib/server/errors";
import { WorkspaceAccessContext } from "@/lib/server/workspace-context";

type WorkspacePort = {
  findMembership(
    workspaceId: number,
    userId: number,
  ): Promise<{ userId: number; role: WorkspaceRole } | null>;
  countMembers(workspaceId: number): Promise<number>;
  findPlanLimit(planCode: BillingPlanCode): Promise<{ memberLimit: number } | null>;
};

type TeamMemoPort = {
  listByWorkspaceAndTarget(workspaceId: number, targetUserId: number): Promise<TeamMemoRecord[]>;
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
    this.assertBasicEntitlementActive(context);
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
    this.assertBasicEntitlementActive(context);
    await this.requireWorkspaceMember(context.workspaceId, input.targetUserId);

    const memo = await this.teamMemoStorage.create({
      workspaceId: context.workspaceId,
      targetUserId: input.targetUserId,
      authorUserId: context.userId,
      content: input.content.trim(),
    });

    return toTeamMemoDto(memo, context.workspacePublicId);
  }

  async resolveTeamMemo(context: WorkspaceAccessContext, memoId: number, isResolved: boolean) {
    this.assertBasicEntitlementActive(context);
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
    this.assertBasicEntitlementActive(context);
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
    const membership = await this.workspaceStorage.findMembership(workspaceId, userId);

    if (!membership) {
      throw new NotFoundError("NOT_FOUND");
    }

    return membership;
  }

  private assertBasicEntitlementActive(context: WorkspaceAccessContext) {
    if (!context.entitlement.canAccessBasicSubscription) {
      throw new ForbiddenError("BASIC_SUBSCRIPTION_REQUIRED");
    }
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
