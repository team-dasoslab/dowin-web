import {
  type BillingPlanCode,
  type BillingStatus,
  type NullableEntitlementSource,
} from "@/domain/billing/types";
import { CapacityPolicy, getPlanMemberLimitFromStorage } from "@/domain/workspace/capacity-policy";
import { ForbiddenError } from "@/lib/server/errors";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";

type WorkspacePlanSummary = {
  id: number;
  planCode?: BillingPlanCode | string | null;
};

type MemberCountPort = {
  countMembers(workspaceId: number): Promise<number>;
  findSeatEntitlement?(workspaceId: number): Promise<{ purchasedSeatCount: number } | null>;
  findBillingState(workspaceId: number): Promise<{
    planCode: BillingPlanCode;
    billingStatus: BillingStatus;
    entitlementSource: NullableEntitlementSource;
  } | null>;
  findPlanLimit(planCode: BillingPlanCode): Promise<{ memberLimit: number } | null>;
};

export async function getPlanMemberLimit(
  planCode: string | null | undefined,
  storage: Pick<MemberCountPort, "findPlanLimit">,
): Promise<number | null> {
  return await getPlanMemberLimitFromStorage(planCode, storage);
}

export async function getWorkspaceMemberCapacity(
  workspace: WorkspacePlanSummary,
  storage: MemberCountPort,
) {
  return await new CapacityPolicy(storage).getWorkspaceMemberCapacity(workspace);
}

export async function assertWorkspaceOperationAllowed(
  context: WorkspaceAccessContext,
) {
  if (!context.entitlement.canAccessBasicSubscription) {
    throw new ForbiddenError("BASIC_SUBSCRIPTION_REQUIRED");
  }
  if (context.capacity.isOverLimit) {
    throw new ForbiddenError("WORKSPACE_SEAT_LIMIT_EXCEEDED");
  }
}

export async function assertWorkspaceHasMemberCapacity(
  workspace: WorkspacePlanSummary,
  storage: MemberCountPort,
) {
  await new CapacityPolicy(storage).assertCanAddMember(workspace);
}
