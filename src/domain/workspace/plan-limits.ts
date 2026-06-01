import {
  CapacityPolicy,
  getPlanMemberLimitFromStorage,
} from "@/domain/workspace/capacity-policy";

type WorkspacePlanSummary = {
  id: number;
  planCode?: "BASIC" | "FREE" | "STANDARD" | string | null;
};

type MemberCountPort = {
  countMembers(workspaceId: number): Promise<number>;
  findSeatEntitlement?(
    workspaceId: number,
  ): Promise<{ purchasedSeatCount: number } | null>;
  findBillingState(
    workspaceId: number,
  ): Promise<{
    planCode: "BASIC" | "FREE" | "STANDARD";
    billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
    entitlementSource: "POLAR" | "MANUAL_GRANT" | "PARTNER" | "INTERNAL_TEST" | null;
  } | null>;
  findPlanLimit(
    planCode: "BASIC" | "FREE" | "STANDARD",
  ): Promise<{ memberLimit: number } | null>;
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
  workspace: WorkspacePlanSummary,
  storage: MemberCountPort,
) {
  await new CapacityPolicy(storage).assertWorkspaceUsageAllowed(workspace);
}

export async function assertWorkspaceHasMemberCapacity(
  workspace: WorkspacePlanSummary,
  storage: MemberCountPort,
) {
  await new CapacityPolicy(storage).assertCanAddMember(workspace);
}
