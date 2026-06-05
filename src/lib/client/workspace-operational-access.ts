type BillingStatus = "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
type PlanCode = "BASIC" | "FREE" | "STANDARD";

export type WorkspaceOperationalBilling = {
  planCode: PlanCode;
  billingStatus: BillingStatus;
  requiresManualReview?: boolean;
};

const OPERATIONAL_PATH_SUFFIXES = [
  "/dashboard",
  "/dashboard/my",
  "/setup",
  "/scoreboards",
  "/workspace/report",
  "/profile/export",
];

export function hasWorkspaceOperationalAccess(
  billing: WorkspaceOperationalBilling | null | undefined,
) {
  if (!billing) return false;
  if (billing.requiresManualReview) return false;
  if (billing.planCode !== "BASIC" && billing.planCode !== "STANDARD") {
    return false;
  }

  return (
    billing.billingStatus === "ACTIVE" || billing.billingStatus === "CANCELED"
  );
}

export function isWorkspaceOperationalPath(
  pathname: string,
  workspaceId: string | undefined,
) {
  if (!workspaceId) return false;

  return OPERATIONAL_PATH_SUFFIXES.some((suffix) => {
    const path = `/${workspaceId}${suffix}`;
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}
