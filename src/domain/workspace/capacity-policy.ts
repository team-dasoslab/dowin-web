import { ForbiddenError, ConflictError } from "@/lib/server/errors";

type WorkspacePlanSummary = {
  id: number;
  planCode?: "BASIC" | "FREE" | "STANDARD" | string | null;
};

type WorkspaceBillingState = {
  planCode: "BASIC" | "FREE" | "STANDARD";
  billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
  entitlementSource: "POLAR" | "MANUAL_GRANT" | "PARTNER" | "INTERNAL_TEST" | null;
};

type MemberCapacityPort = {
  countMembers(workspaceId: number): Promise<number>;
  findSeatEntitlement?(
    workspaceId: number,
  ): Promise<{ purchasedSeatCount: number } | null>;
  findBillingState(workspaceId: number): Promise<WorkspaceBillingState | null>;
  findPlanLimit(
    planCode: "BASIC" | "FREE" | "STANDARD",
  ): Promise<{ memberLimit: number } | null>;
};

export type WorkspaceMemberCapacity = {
  workspaceId: number;
  planCode: string | null;
  memberCount: number;
  memberLimit: number | null;
  hasLimit: boolean;
  hasAvailableMemberSlot: boolean;
  isOverLimit: boolean;
};

export async function getPlanMemberLimitFromStorage(
  planCode: string | null | undefined,
  storage: Pick<MemberCapacityPort, "findPlanLimit">,
): Promise<number | null> {
  if (planCode !== "BASIC" && planCode !== "FREE" && planCode !== "STANDARD") {
    return null;
  }

  const planLimit = await storage.findPlanLimit(planCode);
  return planLimit?.memberLimit ?? null;
}

export function hasActiveBasicEntitlement(
  billingState: WorkspaceBillingState | null,
) {
  if (!billingState) return false;
  if (billingState.planCode !== "BASIC" && billingState.planCode !== "STANDARD") {
    return false;
  }

  return (
    billingState.billingStatus === "ACTIVE" ||
    billingState.billingStatus === "CANCELED"
  );
}

export class CapacityPolicy {
  constructor(private storage: MemberCapacityPort) {}

  private async getWorkspaceMemberLimit(
    workspace: WorkspacePlanSummary,
  ): Promise<number | null> {
    const seatEntitlement =
      await this.storage.findSeatEntitlement?.(workspace.id);
    if (seatEntitlement) {
      return seatEntitlement.purchasedSeatCount;
    }

    return await this.getPlanMemberLimit(workspace.planCode);
  }

  async getPlanMemberLimit(
    planCode: string | null | undefined,
  ): Promise<number | null> {
    return await getPlanMemberLimitFromStorage(planCode, this.storage);
  }

  async getWorkspaceMemberCapacity(
    workspace: WorkspacePlanSummary,
  ): Promise<WorkspaceMemberCapacity> {
    const memberLimit = await this.getWorkspaceMemberLimit(workspace);
    const memberCount = await this.storage.countMembers(workspace.id);

    return {
      workspaceId: workspace.id,
      planCode: workspace.planCode ?? null,
      memberCount,
      memberLimit,
      hasLimit: memberLimit !== null,
      hasAvailableMemberSlot: memberLimit === null || memberCount < memberLimit,
      isOverLimit: memberLimit !== null && memberCount > memberLimit,
    };
  }

  async assertCanAddMember(workspace: WorkspacePlanSummary): Promise<void> {
    await this.assertBasicEntitlementActive(workspace);
    const capacity = await this.getWorkspaceMemberCapacity(workspace);

    if (!capacity.hasAvailableMemberSlot) {
      throw new ConflictError("WORKSPACE_MEMBER_LIMIT_REACHED");
    }
  }

  async assertWorkspaceUsageAllowed(
    workspace: WorkspacePlanSummary,
  ): Promise<void> {
    await this.assertBasicEntitlementActive(workspace);
    const capacity = await this.getWorkspaceMemberCapacity(workspace);

    if (capacity.isOverLimit) {
      throw new ForbiddenError("WORKSPACE_SEAT_LIMIT_EXCEEDED");
    }
  }

  private async assertBasicEntitlementActive(
    workspace: WorkspacePlanSummary,
  ): Promise<void> {
    const billingState = await this.storage.findBillingState(workspace.id);
    if (!hasActiveBasicEntitlement(billingState)) {
      throw new ForbiddenError("BASIC_SUBSCRIPTION_REQUIRED");
    }
  }
}
