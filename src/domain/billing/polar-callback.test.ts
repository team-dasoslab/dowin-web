import { describe, expect, it } from "vitest";
import { getPolarBillingCallbackPath } from "./polar-callback";

describe("getPolarBillingCallbackPath", () => {
  it("명시된 locale로 success 경로를 만든다", () => {
    expect(
      getPolarBillingCallbackPath({
        locale: "ko",
        acceptLanguage: "en-US,en;q=0.9",
        billing: "success",
      }),
    ).toBe("/ko/workspace/billing?billing=success");
  });

  it("checkout id가 있으면 함께 전달한다", () => {
    expect(
      getPolarBillingCallbackPath({
        locale: "en",
        acceptLanguage: "ko-KR,ko;q=0.9",
        billing: "success",
        checkoutId: "chk_123",
      }),
    ).toBe("/en/workspace/billing?billing=success&checkout_id=chk_123");
  });

  it("내부 return path가 있으면 원래 경로로 callback query를 전달한다", () => {
    expect(
      getPolarBillingCallbackPath({
        locale: "ko",
        billing: "success",
        checkoutId: "chk_123",
        returnPath: "/ko/ws_123/dashboard/my?view=week",
      }),
    ).toBe("/ko/ws_123/dashboard/my?view=week&billing=success&checkout_id=chk_123");
  });

  it("외부 return path는 무시하고 기본 billing 경로로 보낸다", () => {
    expect(
      getPolarBillingCallbackPath({
        locale: "ko",
        returnPath: "//evil.example/path",
      }),
    ).toBe("/ko/workspace/billing");
  });

  it("locale이 없으면 Accept-Language 기준으로 fallback한다", () => {
    expect(
      getPolarBillingCallbackPath({
        acceptLanguage: "en-US,en;q=0.9",
      }),
    ).toBe("/en/workspace/billing");
  });
});
