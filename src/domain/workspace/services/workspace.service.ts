import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/server/errors";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { customAlphabet } from "nanoid";

type Workspace = NonNullable<
  Awaited<ReturnType<WorkspaceStorage["findUserWorkspace"]>>
>;
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

const generateWorkspaceInviteCode = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZ",
  10,
);

const isWorkspaceMembershipUniqueViolation = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("workspace_members.user_id") ||
    error.message.includes("workspace_members_user_unique"));

export interface WorkspaceStoragePort {
  findWorkspaceById: WorkspaceStorage["findWorkspaceById"];
  findUserWorkspace: WorkspaceStorage["findUserWorkspace"];
  createWorkspace: WorkspaceStorage["createWorkspace"];
  updateWorkspaceName: WorkspaceStorage["updateWorkspaceName"];
  addMember: WorkspaceStorage["addMember"];
  findMembershipById: WorkspaceStorage["findMembershipById"];
  findMembership: WorkspaceStorage["findMembership"];
  findMembers: WorkspaceStorage["findMembers"];
  removeMemberById: WorkspaceStorage["removeMemberById"];
  createInvite: WorkspaceStorage["createInvite"];
  findInviteByCode: WorkspaceStorage["findInviteByCode"];
  findInviteById: WorkspaceStorage["findInviteById"];
  listInvites: WorkspaceStorage["listInvites"];
  updateInviteStatus: WorkspaceStorage["updateInviteStatus"];
  addMemberByInvite: WorkspaceStorage["addMemberByInvite"];
}

export class WorkspaceService {
  constructor(private storage: WorkspaceStoragePort) {}

  async getMyWorkspace(userId: number): Promise<Workspace> {
    const workspace = await this.storage.findUserWorkspace(userId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }
    return workspace;
  }

  async createWorkspace(userId: number, name: string): Promise<Workspace> {
    const existing = await this.storage.findUserWorkspace(userId);
    if (existing) {
      throw new ConflictError("ALREADY_IN_WORKSPACE");
    }

    const workspace = await this.storage.createWorkspace(name);
    try {
      await this.storage.addMember(workspace.id, userId, "ADMIN");
    } catch (error) {
      if (isWorkspaceMembershipUniqueViolation(error)) {
        throw new ConflictError("ALREADY_IN_WORKSPACE");
      }
      throw error;
    }
    return workspace;
  }

  async updateWorkspaceName(workspaceId: number, name: string): Promise<Workspace> {
    const workspace = await this.storage.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const updatedWorkspace = await this.storage.updateWorkspaceName(workspaceId, name);
    if (!updatedWorkspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    return updatedWorkspace;
  }

  async joinWorkspace(workspaceId: number, userId: number): Promise<void> {
    const existing = await this.storage.findUserWorkspace(userId);
    if (existing) {
      throw new ConflictError("ALREADY_IN_WORKSPACE");
    }

    const workspace = await this.storage.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

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

  async joinWorkspaceByInvite(code: string, userId: number): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.storage.findUserWorkspace(userId);
    if (existing) {
      throw new ConflictError("ALREADY_IN_WORKSPACE");
    }

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
      const adminCount = members.filter((member) => member.role === "ADMIN").length;

      if (adminCount <= 1) {
        throw new ForbiddenError("CANNOT_REMOVE_LAST_ADMIN");
      }
    }

    await this.storage.removeMemberById(workspaceId, membershipId);
  }
}
