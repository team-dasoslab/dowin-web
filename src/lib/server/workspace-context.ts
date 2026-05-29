import { NotFoundError } from "@/lib/server/errors";

type WorkspaceStoragePort = {
  getAccessContextData(workspaceId: number, userId: number): Promise<{
    workspace: {
      id: number;
      uid: string | null;
      name: string;
      planCode: "BASIC" | "FREE" | "STANDARD";
    };
    member: {
      id: number;
      userId: number;
      role: "ADMIN" | "MEMBER";
    };
    billingState: {
      planCode: "BASIC" | "FREE" | "STANDARD";
      billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
      entitlementSource: "POLAR" | "MANUAL_GRANT" | "PARTNER" | "INTERNAL_TEST" | null;
    } | null;
  } | null>;
};

export type WorkspaceAccessContext = {
  workspaceId: number;
  workspacePublicId: string;
  workspaceName: string;
  userId: number;
  role: "ADMIN" | "MEMBER";
  membershipId: number;
  entitlement: {
    canAccessBasicSubscription: boolean;
    entitlementSource: "POLAR" | "MANUAL_GRANT" | "PARTNER" | "INTERNAL_TEST" | null;
    billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
    planCode: "BASIC" | "FREE" | "STANDARD";
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
  if (!workspace.uid) {
    throw new Error(`WORKSPACE_UID_MISSING:${workspace.id}`);
  }

  const planCode = billingState?.planCode ?? workspace.planCode;
  const billingStatus = billingState?.billingStatus ?? "NONE";
  const entitlementSource = billingState?.entitlementSource ?? null;

  // DB planCode는 아직 FREE/STANDARD 호환값을 쓰지만, 제품 권한은 Basic 구독 활성 여부로 해석한다.
  const canAccessBasicSubscription = planCode === "STANDARD";

  return {
    workspaceId: workspace.id,
    workspacePublicId: workspace.uid,
    workspaceName: workspace.name,
    userId: member.userId,
    role: member.role,
    membershipId: member.id,
    entitlement: {
      canAccessBasicSubscription,
      entitlementSource,
      billingStatus,
      planCode,
    },
  };
}
