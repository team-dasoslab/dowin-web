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

  it("customer session에 team member id를 포함할 수 있다", async () => {
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
      client?.createCustomerSession({
        customerId: "cus_123",
        memberId: "member_123",
      }),
    ).resolves.toEqual({
      customerPortalUrl: "https://polar.sh/acme/portal/session",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://sandbox-api.polar.sh/v1/customer-sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          customer_id: "cus_123",
          member_id: "member_123",
        }),
      }),
    );
  });

  it("subscription seat 수를 PATCH /subscriptions/{id}로 변경한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "sub_123",
          seats: 5,
          pending_update: null,
        }),
        {
          status: 200,
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
      client?.updateSubscriptionSeats({
        subscriptionId: "sub_123",
        seatCount: 5,
        prorationBehavior: "prorate",
      }),
    ).resolves.toEqual({
      subscriptionId: "sub_123",
      seats: 5,
      pendingSeats: null,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://sandbox-api.polar.sh/v1/subscriptions/sub_123",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          seats: 5,
          proration_behavior: "prorate",
        }),
      }),
    );
  });

  it("checkout 성공과 복귀 URL에 return path를 포함한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "checkout_123",
          url: "https://polar.sh/checkout/checkout_123",
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

    await client?.createCheckoutSession({
      productId: "prod_basic",
      externalCustomerId: "workspace:1",
      idempotencyKey: "idem_1",
      locale: "ko",
      metadata: { flow: "workspace_resubscribe" },
      returnPath: "/ko/ws_1/dashboard/my?view=week",
    });

    const body = JSON.parse(
      String((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body),
    ) as { success_url: string; return_url: string };
    expect(new URL(body.success_url).searchParams.get("return_path")).toBe(
      "/ko/ws_1/dashboard/my?view=week",
    );
    expect(new URL(body.return_url).searchParams.get("return_path")).toBe(
      "/ko/ws_1/dashboard/my?view=week",
    );
  });

  it("subscription의 pending seat 변경을 조회한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "sub_123",
          seats: 10,
          pending_update: {
            seats: 5,
          },
        }),
        {
          status: 200,
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
      client?.getSubscriptionSeatUpdate({
        subscriptionId: "sub_123",
      }),
    ).resolves.toEqual({
      subscriptionId: "sub_123",
      seats: 10,
      pendingSeats: 5,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://sandbox-api.polar.sh/v1/subscriptions/sub_123",
      expect.objectContaining({
        method: "GET",
      }),
    );
  });

  it("checkout id로 subscription을 조회한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "sub_123",
              customer_id: "cus_123",
              seats: 10,
            },
          ],
        }),
        {
          status: 200,
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
      client?.findSubscriptionByCheckoutId({
        checkoutId: "checkout_123",
      }),
    ).resolves.toEqual({
      subscriptionKey: "sub_123",
      customerKey: "cus_123",
      seats: 10,
    });

    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(`${calledUrl.origin}${calledUrl.pathname}`).toBe(
      "https://sandbox-api.polar.sh/v1/subscriptions",
    );
    expect(calledUrl.searchParams.get("checkout_id")).toBe("checkout_123");
    expect(calledUrl.searchParams.get("limit")).toBe("1");
  });

  it("subscription seat의 member id를 조회한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          seats: [
            {
              member_id: "mem_member",
              member: {
                id: "mem_owner",
              },
            },
          ],
        }),
        {
          status: 200,
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
      client?.findSubscriptionSeatMemberId({
        subscriptionId: "sub_123",
      }),
    ).resolves.toBe("mem_member");

    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(`${calledUrl.origin}${calledUrl.pathname}`).toBe(
      "https://sandbox-api.polar.sh/v1/customer-seats",
    );
    expect(calledUrl.searchParams.get("subscription_id")).toBe("sub_123");
  });

  it("customer email로 subscription seat를 assign한다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "cus_123",
            email: "buyer@example.com",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            member_id: "mem_assigned",
          }),
          {
            status: 200,
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
      client?.assignSubscriptionSeat({
        subscriptionId: "sub_123",
        customerId: "cus_123",
      }),
    ).resolves.toBe("mem_assigned");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://sandbox-api.polar.sh/v1/customers/cus_123",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://sandbox-api.polar.sh/v1/customer-seats",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          subscription_id: "sub_123",
          email: "buyer@example.com",
          immediate_claim: true,
        }),
      }),
    );
  });
});
