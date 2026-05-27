import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import {
  assertFreePlanWithinMemberLimit,
  getPlanMemberLimit,
} from "@/domain/workspace/plan-limits";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import { customAlphabet } from "nanoid";

type Workspace = NonNullable<
  Awaited<ReturnType<WorkspaceStorage["findUserWorkspace"]>>
>;
type PublicWorkspace = Omit<Workspace, "id" | "uid"> & {
  id: string;
};
type WorkspaceWithPlanLimits = PublicWorkspace & {
  freeMemberLimit: number;
  isOverFreeMemberLimit: boolean;
  memberCount: number;
};
type WorkspaceListItem = {
  id: string;
  name: string;
  planCode: "FREE" | "STANDARD";
  role: "ADMIN" | "MEMBER";
  isCurrent: boolean;
  createdAt: Date;
};
type WorkspaceMemberListItem = {
  id: number;
  nickname: string;
  avatarKey: string | null;
  role: "ADMIN" | "MEMBER";
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

const toPublicWorkspace = (workspace: Workspace): PublicWorkspace => {
  return {
    id: getWorkspacePublicId(workspace),
    name: workspace.name,
    planCode: workspace.planCode,
    billingCustomerExternalRef: workspace.billingCustomerExternalRef,
    billingOwnerUserId: workspace.billingOwnerUserId,
    createdAt: workspace.createdAt,
  };
};

export interface WorkspaceStoragePort {
  resolveIdByUid: WorkspaceStorage["resolveIdByUid"];
  findWorkspaceById: WorkspaceStorage["findWorkspaceById"];
  findUserWorkspace: WorkspaceStorage["findUserWorkspace"];
  listUserWorkspaces: WorkspaceStorage["listUserWorkspaces"];
  createWorkspace: WorkspaceStorage["createWorkspace"];
  updateWorkspaceName: WorkspaceStorage["updateWorkspaceName"];
  addMember: WorkspaceStorage["addMember"];
  findMembershipById: WorkspaceStorage["findMembershipById"];
  findMembership: WorkspaceStorage["findMembership"];
  findMembers: WorkspaceStorage["findMembers"];
  countMembers: WorkspaceStorage["countMembers"];
  findPlanLimit: WorkspaceStorage["findPlanLimit"];
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
      createdAt: membership.workspace.createdAt,
    }));
  }

  async getMyWorkspace(userId: number): Promise<WorkspaceWithPlanLimits> {
    const workspace = await this.storage.findUserWorkspace(userId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }
    const memberCount = await this.storage.countMembers(workspace.id);
    const freeMemberLimit = await getPlanMemberLimit("FREE", this.storage);

    return {
      ...toPublicWorkspace(workspace),
      freeMemberLimit: freeMemberLimit ?? 10,
      isOverFreeMemberLimit:
        workspace.planCode === "FREE" &&
        freeMemberLimit !== null &&
        memberCount > freeMemberLimit,
      memberCount,
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

  async updateWorkspaceName(
    workspaceId: number,
    name: string,
  ): Promise<PublicWorkspace> {
    const workspace = await this.storage.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const updatedWorkspace = await this.storage.updateWorkspaceName(
      workspaceId,
      name,
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
    workspaceId: number,
    createdByUserId: number,
    maxUses: number,
  ): Promise<WorkspaceInvite> {
    const workspace = await this.storage.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }
    await assertFreePlanWithinMemberLimit(workspace, this.storage);

    return await this.storage.createInvite({
      workspaceId,
      code: generateWorkspaceInviteCode(),
      maxUses,
      createdByUserId,
    });
  }

  async listInvites(workspaceId: number): Promise<WorkspaceInvite[]> {
    return await this.storage.listInvites(workspaceId);
  }

  async updateInviteStatus(
    workspaceId: number,
    inviteId: number,
    status: "ACTIVE" | "INACTIVE",
  ): Promise<WorkspaceInvite> {
    if (status === "ACTIVE") {
      const workspace = await this.storage.findWorkspaceById(workspaceId);
      if (!workspace) {
        throw new NotFoundError("NOT_FOUND");
      }
      await assertFreePlanWithinMemberLimit(workspace, this.storage);
    }

    const updated = await this.storage.updateInviteStatus(
      workspaceId,
      inviteId,
      status,
    );

    if (!updated) {
      throw new NotFoundError("NOT_FOUND");
    }

    return updated;
  }

  async listTags(workspaceId: number): Promise<WorkspaceTag[]> {
    return await this.storage.listTags(workspaceId);
  }

  async createTag(
    workspaceId: number,
    userId: number,
    input: { name: string; normalizedName: string },
  ): Promise<WorkspaceTag> {
    const workspace = await this.storage.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }
    await assertFreePlanWithinMemberLimit(workspace, this.storage);

    try {
      return await this.storage.createTag({
        workspaceId,
        name: input.name,
        normalizedName: input.normalizedName,
        createdByUserId: userId,
      });
    } catch (error) {
      if (isWorkspaceTagUniqueViolation(error)) {
        throw new ConflictError("WORKSPACE_TAG_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  async updateTag(
    workspaceId: number,
    tagId: number,
    input: { name: string; normalizedName: string },
  ): Promise<WorkspaceTag> {
    const existingTag = await this.storage.findTagById(workspaceId, tagId);
    if (!existingTag) {
      throw new NotFoundError("NOT_FOUND");
    }
    const workspace = await this.storage.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }
    await assertFreePlanWithinMemberLimit(workspace, this.storage);

    try {
      const updated = await this.storage.updateTag(workspaceId, tagId, input);
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

  async deleteTag(workspaceId: number, tagId: number): Promise<void> {
    const existingTag = await this.storage.findTagById(workspaceId, tagId);
    if (!existingTag) {
      throw new NotFoundError("NOT_FOUND");
    }
    const workspace = await this.storage.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }
    await assertFreePlanWithinMemberLimit(workspace, this.storage);

    await this.storage.deleteTag(workspaceId, tagId);
  }

  async joinWorkspaceByInvite(code: string, userId: number): Promise<void> {
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
  }

  private async ensureWorkspaceHasMemberCapacity(workspace: Workspace) {
    const memberLimit = await getPlanMemberLimit(workspace.planCode, this.storage);
    if (memberLimit === null) {
      return;
    }

    const memberCount = await this.storage.countMembers(workspace.id);
    if (memberCount >= memberLimit) {
      throw new ConflictError("WORKSPACE_MEMBER_LIMIT_REACHED");
    }
  }

  async getMembers(
    workspaceId: number,
    currentUserId: number,
  ): Promise<WorkspaceMemberListItem[]> {
    const members = await this.storage.findMembers(workspaceId);

    return members.map((member) => ({
      id: member.id,
      nickname: member.user.nickname,
      avatarKey: member.user.avatarKey,
      role: member.role,
      isMe: member.userId === currentUserId,
      createdAt: member.createdAt,
    }));
  }

  async removeMember(
    workspaceId: number,
    actorUserId: number,
    membershipId: number,
  ): Promise<void> {
    const targetMembership = await this.storage.findMembershipById(
      workspaceId,
      membershipId,
    );
    if (!targetMembership) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (actorUserId === targetMembership.userId) {
      throw new ForbiddenError("FORBIDDEN");
    }

    if (targetMembership.role === "ADMIN") {
      const members = await this.storage.findMembers(workspaceId);
      const adminCount = members.filter(
        (member) => member.role === "ADMIN",
      ).length;

      if (adminCount <= 1) {
        throw new ForbiddenError("CANNOT_REMOVE_LAST_ADMIN");
      }
    }

    await this.storage.removeMemberById(workspaceId, membershipId);
  }

  async leaveWorkspace(workspaceId: number, userId: number): Promise<void> {
    const membership = await this.storage.findMembership(workspaceId, userId);
    if (!membership) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (membership.role === "ADMIN") {
      throw new ConflictError("ADMIN_TRANSFER_REQUIRED");
    }

    await this.storage.removeMemberById(workspaceId, membership.id);
  }

  async transferAdmin(
    workspaceId: number,
    actorUserId: number,
    targetMembershipId: number,
  ): Promise<void> {
    const targetMembership = await this.storage.findMembershipById(
      workspaceId,
      targetMembershipId,
    );
    if (!targetMembership) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (targetMembership.userId === actorUserId) {
      throw new ForbiddenError("FORBIDDEN");
    }

    await this.storage.transferAdmin(
      workspaceId,
      actorUserId,
      targetMembership.userId,
    );
  }

  async deleteWorkspace(workspaceId: number): Promise<void> {
    const workspace = await this.storage.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    await this.storage.deleteWorkspace(workspaceId);
  }
}
