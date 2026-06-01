import { afterEach, describe, expect, it, vi } from "vitest";
import { createPolarBillingClient } from "./polar";

describe("createPolarBillingClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("customer session은 Polar 문서의 trailing slash 없는 endpoint로 생성한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          customer_portal_url: "https://polar.sh/acme/portal/session",
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createPolarBillingClient({
      POLAR_ENV: "sandbox",
      POLAR_ACCESS_TOKEN: "polar_oat_sandbox",
      APP_BASE_URL: "http://localhost:3000",
    });

    await expect(
      client?.createCustomerSession({ externalCustomerId: "workspace:1" }),
    ).resolves.toEqual({
      customerPortalUrl: "https://polar.sh/acme/portal/session",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://sandbox-api.polar.sh/v1/customer-sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ external_customer_id: "workspace:1" }),
      }),
    );
  });
});
