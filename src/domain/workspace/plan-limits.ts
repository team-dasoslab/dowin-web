import { ForbiddenError } from "@/lib/server/errors";

type WorkspacePlanSummary = {
  id: number;
  planCode?: "FREE" | "STANDARD" | string | null;
};

type MemberCountPort = {
  countMembers(workspaceId: number): Promise<number>;
  findPlanLimit(
    planCode: "FREE" | "STANDARD",
  ): Promise<{ memberLimit: number } | null>;
};

export async function getPlanMemberLimit(
  planCode: string | null | undefined,
  storage: Pick<MemberCountPort, "findPlanLimit">,
): Promise<number | null> {
  if (planCode !== "FREE" && planCode !== "STANDARD") {
    return null;
  }

  const planLimit = await storage.findPlanLimit(planCode);
  return planLimit?.memberLimit ?? null;
}

export async function assertFreePlanWithinMemberLimit(
  workspace: WorkspacePlanSummary,
  storage: MemberCountPort,
) {
  if (workspace.planCode !== "FREE") {
    return;
  }

  const memberLimit = await getPlanMemberLimit(workspace.planCode, storage);
  if (memberLimit === null) {
    return;
  }

  const memberCount = await storage.countMembers(workspace.id);
  if (memberCount > memberLimit) {
    throw new ForbiddenError("FREE_PLAN_MEMBER_LIMIT_EXCEEDED");
  }
}
