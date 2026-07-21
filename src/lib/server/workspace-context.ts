import { hasBasicOperationalEntitlement } from "@/domain/billing/entitlement-policy";
import {
  type BillingPlanCode,
  type BillingStatus,
  type NullableEntitlementSource,
} from "@/domain/billing/types";
import { type WorkspaceRole } from "@/domain/workspace/types";
import { NotFoundError } from "@/lib/server/errors";

type WorkspaceStoragePort = {
  getAccessContextData(
    workspaceId: number,
    userId: number,
  ): Promise<{
    workspace: {
      id: number;
      uid: string | null;
      name: string;
      planCode: BillingPlanCode;
      allowPastDailyLogEdit?: boolean | null;
    };
    member: {
      id: number;
      userId: number;
      role: WorkspaceRole;
    };
    billingState: {
      planCode: BillingPlanCode;
      billingStatus: BillingStatus;
      entitlementSource: NullableEntitlementSource;
    } | null;
  } | null>;
};

export type WorkspaceAccessContext = {
  workspaceId: number;
  workspacePublicId: string;
  workspaceName: string;
  userId: number;
  role: WorkspaceRole;
  membershipId: number;
  allowPastDailyLogEdit: boolean;
  entitlement: {
    canAccessBasicSubscription: boolean;
    entitlementSource: NullableEntitlementSource;
    billingStatus: BillingStatus;
    planCode: BillingPlanCode;
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

  // FREE/STANDARD는 과거 호환 코드값일 뿐이며, 제품 권한은 Basic entitlement 활성 여부로 해석한다.
  const canAccessBasicSubscription = hasBasicOperationalEntitlement({
    planCode,
    billingStatus,
  });

  return {
    workspaceId: workspace.id,
    workspacePublicId: workspace.uid,
    workspaceName: workspace.name,
    userId: member.userId,
    role: member.role,
    membershipId: member.id,
    allowPastDailyLogEdit: workspace.allowPastDailyLogEdit ?? false,
    entitlement: {
      canAccessBasicSubscription,
      entitlementSource,
      billingStatus,
      planCode,
    },
  };
}
