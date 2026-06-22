import { hasBasicOperationalEntitlement } from "@/domain/billing/entitlement-policy";
import { describe, expect, it } from "vitest";

describe("billing entitlement policy", () => {
  it("allows only operational Basic or legacy Standard billing states", () => {
    expect(
      hasBasicOperationalEntitlement({
        planCode: "BASIC",
        billingStatus: "ACTIVE",
      }),
    ).toBe(true);
    expect(
      hasBasicOperationalEntitlement({
        planCode: "STANDARD",
        billingStatus: "CANCELED",
      }),
    ).toBe(true);
    expect(
      hasBasicOperationalEntitlement({
        planCode: "BASIC",
        billingStatus: "EXPIRED",
      }),
    ).toBe(false);
    expect(
      hasBasicOperationalEntitlement({
        planCode: "FREE",
        billingStatus: "ACTIVE",
      }),
    ).toBe(false);
  });
});
