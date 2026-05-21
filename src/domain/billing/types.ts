export const entitlementSourceValues = [
  "POLAR",
  "MANUAL_GRANT",
  "PARTNER",
  "INTERNAL_TEST",
] as const;

export type EntitlementSource = (typeof entitlementSourceValues)[number];
export type NullableEntitlementSource = EntitlementSource | null;
