export const entitlementSourceValues = [
  "POLAR",
  "MANUAL_GRANT",
  "PARTNER",
  "INTERNAL_TEST",
  "BETA_PROMOTIONAL_GRANT",
] as const;

export type EntitlementSource = (typeof entitlementSourceValues)[number];
export type NullableEntitlementSource = EntitlementSource | null;

export const BILLING_PLAN = {
  BASIC: "BASIC",
  FREE: "FREE",
  STANDARD: "STANDARD",
} as const;

export const billingPlanCodeValues = [
  BILLING_PLAN.BASIC,
  BILLING_PLAN.FREE,
  BILLING_PLAN.STANDARD,
] as const;
export type BillingPlanCode = (typeof billingPlanCodeValues)[number];

export const billingStatusValues = ["NONE", "ACTIVE", "CANCELED", "EXPIRED", "REVOKED"] as const;
export type BillingStatus = (typeof billingStatusValues)[number];
