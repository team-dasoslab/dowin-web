import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/server/errors";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";

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
    await this.storage.addMember(workspace.id, userId, "ADMIN");
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

    await this.storage.addMember(workspaceId, userId, "MEMBER");
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
