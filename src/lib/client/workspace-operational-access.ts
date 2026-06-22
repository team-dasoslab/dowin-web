import {
  hasBasicOperationalEntitlement,
  type BillingPlanCode,
  type BillingStatus,
} from "@/domain/billing/entitlement-policy";

export type WorkspaceOperationalBilling = {
  planCode: BillingPlanCode;
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

  return hasBasicOperationalEntitlement(billing);
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
