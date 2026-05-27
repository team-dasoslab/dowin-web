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

export async function assertFreePlanWithinMemberLimit(
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
