import {
  hasWorkspaceOperationalAccess,
  isWorkspaceOperationalPath,
} from "@/lib/client/workspace-operational-access";
import { describe, expect, it } from "vitest";

describe("workspace operational access", () => {
  it("ACTIVE 또는 CANCELED Basic entitlement만 운영 접근을 허용한다", () => {
    expect(
      hasWorkspaceOperationalAccess({
        planCode: "BASIC",
        billingStatus: "ACTIVE",
      }),
    ).toBe(true);
    expect(
      hasWorkspaceOperationalAccess({
        planCode: "BASIC",
        billingStatus: "CANCELED",
      }),
    ).toBe(true);
    expect(
      hasWorkspaceOperationalAccess({
        planCode: "BASIC",
        billingStatus: "EXPIRED",
      }),
    ).toBe(false);
    expect(
      hasWorkspaceOperationalAccess({
        planCode: "FREE",
        billingStatus: "ACTIVE",
      }),
    ).toBe(false);
  });

  it("수동 검토가 필요하면 결제 상태가 활성이어도 운영 접근을 막는다", () => {
    expect(
      hasWorkspaceOperationalAccess({
        planCode: "BASIC",
        billingStatus: "ACTIVE",
        requiresManualReview: true,
      }),
    ).toBe(false);
  });

  it("운영 화면 경로만 차단 대상으로 분류한다", () => {
    expect(isWorkspaceOperationalPath("/ws_1/dashboard", "ws_1")).toBe(true);
    expect(isWorkspaceOperationalPath("/ws_1/dashboard/my", "ws_1")).toBe(true);
    expect(isWorkspaceOperationalPath("/ws_1/workspace/export", "ws_1")).toBe(
      true,
    );
    expect(isWorkspaceOperationalPath("/ws_1/workspace/billing", "ws_1")).toBe(
      false,
    );
    expect(isWorkspaceOperationalPath("/ws_1/subscription-required", "ws_1")).toBe(
      false,
    );
  });
});
