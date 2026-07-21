import { type BillingPlanCode } from "@/domain/billing/types";
import { type WorkspaceRole } from "@/domain/workspace/types";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  assertWorkspaceHasMemberCapacity,
  getPlanMemberLimit,
  getWorkspaceMemberCapacity,
} from "@/domain/workspace/plan-limits";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import { customAlphabet } from "nanoid";

type Workspace = NonNullable<
  Awaited<ReturnType<WorkspaceStorage["findUserWorkspace"]>>
>;
type PublicWorkspace = {
  id: string;
  name: string;
  planCode: BillingPlanCode;
  allowPastDailyLogEdit: boolean;
  createdAt: Date;
};
type WorkspaceWithPlanLimits = PublicWorkspace & {
  freeMemberLimit: number;
  isOverFreeMemberLimit: boolean;
  memberCount: number;
  role: WorkspaceRole;
};
type WorkspaceListItem = {
  id: string;
  name: string;
  planCode: BillingPlanCode;
  role: WorkspaceRole;
  isCurrent: boolean;
  allowPastDailyLogEdit: boolean;
  createdAt: Date;
};
type WorkspaceMemberListItem = {
  id: number;
  nickname: string;
  avatarKey: string | null;
  role: WorkspaceRole;
  isMe: boolean;
  createdAt: Date;
};
type WorkspaceInvite = NonNullable<
  Awaited<ReturnType<WorkspaceStorage["createInvite"]>>
>;
type WorkspaceTag = NonNullable<
  Awaited<ReturnType<WorkspaceStorage["createTag"]>>
>;

const generateWorkspaceInviteCode = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZ",
  10,
);

const isWorkspaceMembershipUniqueViolation = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("workspace_members.workspace_id") ||
    error.message.includes("workspace_members.user_id") ||
    error.message.includes("workspace_members_workspace_user_unique") ||
    error.message.includes("workspace_members_user_unique"));

const collectErrorMessages = (error: unknown): string[] => {
  if (!(error instanceof Error)) {
    return [];
  }

  const messages = [error.message];
  const cause = "cause" in error ? error.cause : undefined;

  if (cause instanceof Error) {
    messages.push(...collectErrorMessages(cause));
  }

  return messages;
};

const isWorkspaceTagUniqueViolation = (error: unknown) => {
  const messages = collectErrorMessages(error);

  return messages.some(
    (message) =>
      message.includes("workspace_tags_workspace_normalized_name_unique") ||
      message.includes(
        "workspace_tags.workspace_id, workspace_tags.normalized_name",
      ) ||
      message.includes("workspace_tags.normalized_name") ||
      message.includes("workspace_tags.workspace_id"),
  );
};

const getWorkspacePublicId = (workspace: Pick<Workspace, "id" | "uid">) => {
  if (!workspace.uid) {
    throw new Error(`WORKSPACE_UID_MISSING:${workspace.id}`);
  }

  return workspace.uid;
};

const hasBlockingPolarSubscriptionForDeletion = (
  billingState: Awaited<ReturnType<WorkspaceStorage["findBillingState"]>>,
) => {
  if (
    billingState?.entitlementSource !== "POLAR" ||
    billingState.provider !== "POLAR"
  ) {
    return false;
  }

  if (billingState.billingStatus === "ACTIVE") {
    return true;
  }

  return false;
};

const toPublicWorkspace = (workspace: Workspace): PublicWorkspace => {
  return {
    id: getWorkspacePublicId(workspace),
    name: workspace.name,
    planCode: workspace.planCode,
    allowPastDailyLogEdit: workspace.allowPastDailyLogEdit,
    createdAt: workspace.createdAt,
  };
};

export interface WorkspaceStoragePort {
  resolveIdByUid: WorkspaceStorage["resolveIdByUid"];
  findWorkspaceById: WorkspaceStorage["findWorkspaceById"];
  findUserWorkspace: WorkspaceStorage["findUserWorkspace"];
  listUserWorkspaces: WorkspaceStorage["listUserWorkspaces"];
  createWorkspace: WorkspaceStorage["createWorkspace"];
  updateWorkspace: WorkspaceStorage["updateWorkspace"];
  addMember: WorkspaceStorage["addMember"];
  findMembershipById: WorkspaceStorage["findMembershipById"];
  findMembership: WorkspaceStorage["findMembership"];
  findMembers: WorkspaceStorage["findMembers"];
  countMembers: WorkspaceStorage["countMembers"];
  findPlanLimit: WorkspaceStorage["findPlanLimit"];
  findBillingState: WorkspaceStorage["findBillingState"];
  findSeatEntitlement: WorkspaceStorage["findSeatEntitlement"];
  removeMemberById: WorkspaceStorage["removeMemberById"];
  updateMemberRole: WorkspaceStorage["updateMemberRole"];
  transferAdmin: WorkspaceStorage["transferAdmin"];
  deleteWorkspace: WorkspaceStorage["deleteWorkspace"];
  createInvite: WorkspaceStorage["createInvite"];
  findInviteByCode: WorkspaceStorage["findInviteByCode"];
  findInviteById: WorkspaceStorage["findInviteById"];
  listInvites: WorkspaceStorage["listInvites"];
  updateInviteStatus: WorkspaceStorage["updateInviteStatus"];
  addMemberByInvite: WorkspaceStorage["addMemberByInvite"];
  listTags: WorkspaceStorage["listTags"];
  findTagById: WorkspaceStorage["findTagById"];
  findTagsByIds: WorkspaceStorage["findTagsByIds"];
  createTag: WorkspaceStorage["createTag"];
  updateTag: WorkspaceStorage["updateTag"];
  deleteTag: WorkspaceStorage["deleteTag"];
}

export class WorkspaceService {
  constructor(private storage: WorkspaceStoragePort) {}

  async resolveWorkspaceIdByUid(uid: string): Promise<number | null> {
    return await this.storage.resolveIdByUid(uid);
  }

  async listMyWorkspaces(
    userId: number,
    currentWorkspaceId?: number | null,
  ): Promise<WorkspaceListItem[]> {
    const memberships = await this.storage.listUserWorkspaces(userId);
    const resolvedCurrentWorkspaceId =
      currentWorkspaceId ?? memberships[0]?.workspace.id ?? null;

    return memberships.map((membership) => ({
      id: getWorkspacePublicId(membership.workspace),
      name: membership.workspace.name,
      planCode: membership.workspace.planCode,
      role: membership.role,
      isCurrent: membership.workspace.id === resolvedCurrentWorkspaceId,
      allowPastDailyLogEdit: membership.workspace.allowPastDailyLogEdit ?? false,
      createdAt: membership.workspace.createdAt,
    }));
  }

  async getMyWorkspace(userId: number, currentWorkspaceUid?: string): Promise<WorkspaceWithPlanLimits> {
    let workspace = null;
    let currentMembership: Awaited<
      ReturnType<WorkspaceStoragePort["findMembership"]>
    > = null;

    if (currentWorkspaceUid) {
      const internalId = await this.storage.resolveIdByUid(currentWorkspaceUid);
      if (internalId) {
        const membership = await this.storage.findMembership(internalId, userId);
        if (membership) {
          currentMembership = membership;
          workspace = await this.storage.findWorkspaceById(internalId);
        }
      }
    }

    if (!workspace) {
      workspace = await this.storage.findUserWorkspace(userId);
    }

    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }
    if (!currentMembership) {
      currentMembership = await this.storage.findMembership(workspace.id, userId);
    }
    if (!currentMembership) {
      throw new NotFoundError("NOT_FOUND");
    }
    const memberCapacity = await getWorkspaceMemberCapacity(
      workspace,
      this.storage,
    );
    const fallbackFreeMemberLimit = await getPlanMemberLimit(
      "FREE",
      this.storage,
    );
    const memberLimit =
      memberCapacity.memberLimit ?? fallbackFreeMemberLimit ?? 10;

    return {
      ...toPublicWorkspace(workspace),
      freeMemberLimit: memberLimit,
      isOverFreeMemberLimit: memberCapacity.memberCount > memberLimit,
      memberCount: memberCapacity.memberCount,
      role: currentMembership.role,
    };
  }

  async createWorkspace(userId: number, name: string): Promise<PublicWorkspace> {
    const workspace = await this.storage.createWorkspace(name);
    try {
      await this.storage.addMember(workspace.id, userId, "ADMIN");
    } catch (error) {
      if (isWorkspaceMembershipUniqueViolation(error)) {
        throw new ConflictError("ALREADY_IN_WORKSPACE");
      }
      throw error;
    }
    return toPublicWorkspace(workspace);
  }

  async updateWorkspace(
    context: WorkspaceAccessContext,
    data: { name: string; allowPastDailyLogEdit?: boolean },
  ): Promise<PublicWorkspace> {
    if (context.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }

    const updatedWorkspace = await this.storage.updateWorkspace(
      context.workspaceId,
      data,
    );
    if (!updatedWorkspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    return toPublicWorkspace(updatedWorkspace);
  }

  async joinWorkspace(workspaceId: number, userId: number): Promise<void> {
    const workspace = await this.storage.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    await this.ensureWorkspaceHasMemberCapacity(workspace);

    try {
      await this.storage.addMember(workspaceId, userId, "MEMBER");
    } catch (error) {
      if (isWorkspaceMembershipUniqueViolation(error)) {
        throw new ConflictError("ALREADY_IN_WORKSPACE");
      }
      throw error;
    }
  }

  async createInvite(
    context: WorkspaceAccessContext,
    maxUses: number,
  ): Promise<WorkspaceInvite> {
    return await this.storage.createInvite({
      workspaceId: context.workspaceId,
      code: generateWorkspaceInviteCode(),
      maxUses,
      createdByUserId: context.userId,
    });
  }

  async listInvites(context: WorkspaceAccessContext): Promise<WorkspaceInvite[]> {
    return await this.storage.listInvites(context.workspaceId);
  }

  async updateInviteStatus(
    context: WorkspaceAccessContext,
    inviteId: number,
    status: "ACTIVE" | "INACTIVE",
  ): Promise<WorkspaceInvite> {
    const updated = await this.storage.updateInviteStatus(
      context.workspaceId,
      inviteId,
      status,
    );

    if (!updated) {
      throw new NotFoundError("NOT_FOUND");
    }

    return updated;
  }

  async listTags(context: WorkspaceAccessContext): Promise<WorkspaceTag[]> {
    return await this.storage.listTags(context.workspaceId);
  }

  async createTag(
    context: WorkspaceAccessContext,
    input: { name: string; normalizedName: string },
  ): Promise<WorkspaceTag> {
    try {
      return await this.storage.createTag({
        workspaceId: context.workspaceId,
        name: input.name,
        normalizedName: input.normalizedName,
        createdByUserId: context.userId,
      });
    } catch (error) {
      if (isWorkspaceTagUniqueViolation(error)) {
        throw new ConflictError("WORKSPACE_TAG_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  async updateTag(
    context: WorkspaceAccessContext,
    tagId: number,
    input: { name: string; normalizedName: string },
  ): Promise<WorkspaceTag> {
    const existingTag = await this.storage.findTagById(context.workspaceId, tagId);
    if (!existingTag) {
      throw new NotFoundError("NOT_FOUND");
    }

    try {
      const updated = await this.storage.updateTag(context.workspaceId, tagId, input);
      if (!updated) {
        throw new NotFoundError("NOT_FOUND");
      }
      return updated;
    } catch (error) {
      if (isWorkspaceTagUniqueViolation(error)) {
        throw new ConflictError("WORKSPACE_TAG_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  async deleteTag(context: WorkspaceAccessContext, tagId: number): Promise<void> {
    const existingTag = await this.storage.findTagById(context.workspaceId, tagId);
    if (!existingTag) {
      throw new NotFoundError("NOT_FOUND");
    }

    await this.storage.deleteTag(context.workspaceId, tagId);
  }

  async joinWorkspaceByInvite(
    code: string,
    userId: number,
  ): Promise<PublicWorkspace> {
    const normalizedCode = code.trim().toUpperCase();
    const invite = await this.storage.findInviteByCode(normalizedCode);
    if (!invite) {
      throw new NotFoundError("INVALID_INVITE_CODE");
    }

    if (invite.status !== "ACTIVE") {
      throw new ConflictError("INVITE_CODE_INACTIVE");
    }

    if (invite.usedCount >= invite.maxUses) {
      throw new ConflictError("INVITE_CODE_USAGE_LIMIT_REACHED");
    }

    const workspace = await this.storage.findWorkspaceById(invite.workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    await this.ensureWorkspaceHasMemberCapacity(workspace);

    let joined = false;
    try {
      joined = await this.storage.addMemberByInvite({
        inviteId: invite.id,
        workspaceId: invite.workspaceId,
        userId,
      });
    } catch (error) {
      if (isWorkspaceMembershipUniqueViolation(error)) {
        throw new ConflictError("ALREADY_IN_WORKSPACE");
      }
      throw error;
    }

    if (!joined) {
      const latestInvite = await this.storage.findInviteById(
        invite.workspaceId,
        invite.id,
      );

      if (!latestInvite) {
        throw new NotFoundError("INVALID_INVITE_CODE");
      }

      if (latestInvite.status !== "ACTIVE") {
        throw new ConflictError("INVITE_CODE_INACTIVE");
      }

      if (latestInvite.usedCount >= latestInvite.maxUses) {
        throw new ConflictError("INVITE_CODE_USAGE_LIMIT_REACHED");
      }

      throw new ConflictError("INVITE_CODE_USAGE_LIMIT_REACHED");
    }

    return toPublicWorkspace(workspace);
  }

  private async ensureWorkspaceHasMemberCapacity(workspace: Workspace) {
    await assertWorkspaceHasMemberCapacity(workspace, this.storage);
  }

  async getMembers(
    context: WorkspaceAccessContext,
  ): Promise<WorkspaceMemberListItem[]> {
    const members = await this.storage.findMembers(context.workspaceId);

    return members.map((member) => ({
      id: member.id,
      nickname: member.user.nickname,
      avatarKey: member.user.avatarKey,
      role: member.role,
      isMe: member.userId === context.userId,
      createdAt: member.createdAt,
    }));
  }

  async removeMember(
    context: WorkspaceAccessContext,
    membershipId: number,
  ): Promise<void> {
    const targetMembership = await this.storage.findMembershipById(
      context.workspaceId,
      membershipId,
    );
    if (!targetMembership) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (context.userId === targetMembership.userId) {
      throw new ForbiddenError("FORBIDDEN");
    }

    if (targetMembership.role === "ADMIN") {
      const members = await this.storage.findMembers(context.workspaceId);
      const adminCount = members.filter(
        (member) => member.role === "ADMIN",
      ).length;

      if (adminCount <= 1) {
        throw new ForbiddenError("CANNOT_REMOVE_LAST_ADMIN");
      }
    }

    await this.storage.removeMemberById(context.workspaceId, membershipId);
  }

  async leaveWorkspace(context: WorkspaceAccessContext): Promise<void> {
    const membership = await this.storage.findMembership(context.workspaceId, context.userId);
    if (!membership) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (membership.role === "ADMIN") {
      throw new ConflictError("ADMIN_TRANSFER_REQUIRED");
    }

    await this.storage.removeMemberById(context.workspaceId, membership.id);
  }

  async transferAdmin(
    context: WorkspaceAccessContext,
    targetMembershipId: number,
  ): Promise<void> {
    const targetMembership = await this.storage.findMembershipById(
      context.workspaceId,
      targetMembershipId,
    );
    if (!targetMembership) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (targetMembership.userId === context.userId) {
      throw new ForbiddenError("FORBIDDEN");
    }

    await this.storage.transferAdmin(
      context.workspaceId,
      context.userId,
      targetMembership.userId,
    );
  }

  async deleteWorkspace(context: WorkspaceAccessContext): Promise<void> {
    const workspace = await this.storage.findWorkspaceById(context.workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const billingState = await this.storage.findBillingState(context.workspaceId);
    if (hasBlockingPolarSubscriptionForDeletion(billingState)) {
      throw new ConflictError("WORKSPACE_ACTIVE_SUBSCRIPTION_DELETE_FORBIDDEN");
    }

    await this.storage.deleteWorkspace(context.workspaceId);
  }
}
