import { NotFoundError } from "@/lib/server/errors";

type WorkspaceStoragePort = {
  getAccessContextData(workspaceId: number, userId: number): Promise<{
    workspace: any;
    member: any;
    billingState: any;
  } | null>;
};

export type WorkspaceAccessContext = {
  workspaceId: number;
  workspaceName: string;
  userId: number;
  role: "ADMIN" | "MEMBER";
  membershipId: number;
  entitlement: {
    canAccessStandardFeatures: boolean;
    entitlementSource: "POLAR" | "MANUAL_GRANT" | "PARTNER" | "INTERNAL_TEST" | null;
    billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
    planCode: "FREE" | "STANDARD";
  };
};

export async function requireWorkspaceAccess(
  workspaceStorage: WorkspaceStoragePort,
  workspaceId: number,
  userId: number,
): Promise<WorkspaceAccessContext> {
  const result = await workspaceStorage.getAccessContextData(workspaceId, userId);

  if (!result || !result.workspace || !result.member) {
    throw new NotFoundError("NOT_FOUND", { detail: "Workspace or membership not found" });
  }

  const { workspace, member, billingState } = result;

  const planCode = billingState?.planCode ?? workspace.planCode;
  const billingStatus = billingState?.billingStatus ?? "NONE";
  const entitlementSource = billingState?.entitlementSource ?? null;

  // FREE는 STANDARD 기능에 접근 불가.
  // 추후 entitlementStatus 추가 시 이곳에 로직 추가.
  const canAccessStandardFeatures = planCode === "STANDARD";

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    userId: member.userId,
    role: member.role,
    membershipId: member.id,
    entitlement: {
      canAccessStandardFeatures,
      entitlementSource,
      billingStatus,
      planCode,
    },
  };
}
