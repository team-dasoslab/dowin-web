import { hasBasicOperationalEntitlement } from "@/domain/billing/entitlement-policy";
import { describe, expect, it } from "vitest";
import { BILLING_PLAN } from "@/domain/billing/types";

describe("billing entitlement policy", () => {
  it("allows only operational Basic or legacy Standard billing states", () => {
    expect(
      hasBasicOperationalEntitlement({
        planCode: BILLING_PLAN.BASIC,
        billingStatus: "ACTIVE",
      }),
    ).toBe(true);
    expect(
      hasBasicOperationalEntitlement({
        planCode: BILLING_PLAN.STANDARD,
        billingStatus: "CANCELED",
      }),
    ).toBe(true);
    expect(
      hasBasicOperationalEntitlement({
        planCode: BILLING_PLAN.BASIC,
        billingStatus: "EXPIRED",
      }),
    ).toBe(false);
    expect(
      hasBasicOperationalEntitlement({
        planCode: BILLING_PLAN.FREE,
        billingStatus: "ACTIVE",
      }),
    ).toBe(false);
  });
});
