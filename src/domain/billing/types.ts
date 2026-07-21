export const entitlementSourceValues = [
  "POLAR",
  "MANUAL_GRANT",
  "PARTNER",
  "INTERNAL_TEST",
  "BETA_PROMOTIONAL_GRANT",
] as const;

export type EntitlementSource = (typeof entitlementSourceValues)[number];
export type NullableEntitlementSource = EntitlementSource | null;

export const billingPlanCodeValues = ["BASIC", "FREE", "STANDARD"] as const;
export type BillingPlanCode = (typeof billingPlanCodeValues)[number];

export const billingStatusValues = ["NONE", "ACTIVE", "CANCELED", "EXPIRED", "REVOKED"] as const;
export type BillingStatus = (typeof billingStatusValues)[number];
