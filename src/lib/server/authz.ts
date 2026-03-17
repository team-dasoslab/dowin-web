import { getDb } from "@/db";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { ForbiddenError } from "@/lib/server/errors";

type Db = ReturnType<typeof getDb>;

export const requireWorkspaceMember = async (
  db: Db,
  workspaceId: number,
  userId: number,
) => {
  const workspaceStorage = new WorkspaceStorage(db);
  const membership = await workspaceStorage.findMembership(workspaceId, userId);

  if (!membership) {
    throw new ForbiddenError("FORBIDDEN");
  }

  return membership;
};

export const requireWorkspaceAdmin = async (db: Db, userId: number) => {
  const workspaceStorage = new WorkspaceStorage(db);
  const membership = await workspaceStorage.findMembershipByUserId(userId);

  if (membership?.role !== "ADMIN") {
    throw new ForbiddenError("FORBIDDEN");
  }

  return membership;
};

export const requireWorkspaceAdminInWorkspace = async (
  db: Db,
  workspaceId: number,
  userId: number,
) => {
  const membership = await requireWorkspaceMember(db, workspaceId, userId);

  if (membership.role !== "ADMIN") {
    throw new ForbiddenError("FORBIDDEN");
  }

  return membership;
};
