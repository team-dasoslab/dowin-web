export type BillingPlanCode = "BASIC" | "FREE" | "STANDARD";
export type BillingStatus =
  | "NONE"
  | "ACTIVE"
  | "CANCELED"
  | "EXPIRED"
  | "REVOKED";

export type BasicEntitlementBillingState = {
  planCode: BillingPlanCode;
  billingStatus: BillingStatus;
};

export const BASIC_OPERATIONAL_PLAN_CODES: readonly BillingPlanCode[] = [
  "BASIC",
  "STANDARD",
];

export const BASIC_OPERATIONAL_BILLING_STATUSES: readonly BillingStatus[] = [
  "ACTIVE",
  "CANCELED",
];

export function hasBasicOperationalEntitlement(
  billingState: BasicEntitlementBillingState | null | undefined,
) {
  if (!billingState) return false;

  return (
    BASIC_OPERATIONAL_PLAN_CODES.includes(billingState.planCode) &&
    BASIC_OPERATIONAL_BILLING_STATUSES.includes(billingState.billingStatus)
  );
}
