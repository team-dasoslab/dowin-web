import { z } from "zod";

const polarConfigSchema = z.object({
  POLAR_ENV: z.enum(["sandbox", "production"]),
  POLAR_CHECKOUT_TOKEN: z.string().trim().min(1).optional(),
  POLAR_ACCESS_TOKEN: z.string().trim().min(1).optional(),
  APP_BASE_URL: z.string().trim().url(),
}).superRefine((value, ctx) => {
  if (!value.POLAR_CHECKOUT_TOKEN && !value.POLAR_ACCESS_TOKEN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Either POLAR_CHECKOUT_TOKEN or POLAR_ACCESS_TOKEN must be configured.",
      path: ["POLAR_CHECKOUT_TOKEN"],
    });
  }
});

type PolarConfig = z.infer<typeof polarConfigSchema>;

type CheckoutSessionResponse = {
  id?: string;
  url: string;
};

type CustomerSessionResponse = {
  customer_portal_url?: string;
  customerPortalUrl?: string;
};

type CheckoutSessionDetailResponse = {
  id: string;
  status?: string;
  seats?: number | null;
  metadata?: Record<string, unknown> | null;
  external_customer_id?: string | null;
  externalCustomerId?: string | null;
  subscription_id?: string | null;
  subscriptionId?: string | null;
  customer_id?: string | null;
  customerId?: string | null;
};

type SubscriptionUpdateResponse = {
  id: string;
  seats?: number | null;
  pending_update?: {
    seats?: number | null;
  } | null;
  pendingUpdate?: {
    seats?: number | null;
  } | null;
};

type SubscriptionProrationBehavior = "invoice" | "prorate" | "next_period";

export type PolarBillingClient = {
  environment: "sandbox" | "production";
  createCheckoutSession(input: {
    productId: string;
    externalCustomerId: string;
    idempotencyKey: string;
    locale: "ko" | "en";
    metadata: Record<string, string>;
    seats?: number;
    minSeats?: number;
    maxSeats?: number;
    successPath?:
      | "/billing/polar/success"
      | "/workspace/checkout/success";
    workspaceCheckoutId?: string;
  }): Promise<{ checkoutUrl: string; checkoutId: string | null }>;
  createCustomerSession(
    input:
      | {
          customerId: string;
        }
      | {
          externalCustomerId: string;
        },
  ): Promise<{ customerPortalUrl: string }>;
  getCheckoutSession(input: { checkoutId: string }): Promise<{
    checkoutId: string;
    status: string | null;
    metadata: Record<string, unknown>;
    externalCustomerId: string | null;
    subscriptionKey: string | null;
    customerKey: string | null;
    seats: number | null;
  }>;
  updateSubscriptionSeats(input: {
    subscriptionId: string;
    seatCount: number;
    prorationBehavior: SubscriptionProrationBehavior;
  }): Promise<{
    subscriptionId: string;
    seats: number | null;
    pendingSeats: number | null;
  }>;
};

class PolarApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Polar API request failed with status ${status}`);
    this.name = "PolarApiError";
  }
}

function getPolarApiBaseUrl(env: PolarConfig["POLAR_ENV"]): string {
  return env === "sandbox"
    ? "https://sandbox-api.polar.sh/v1"
    : "https://api.polar.sh/v1";
}

function getCheckoutAccessToken(config: PolarConfig): string {
  return config.POLAR_CHECKOUT_TOKEN ?? config.POLAR_ACCESS_TOKEN!;
}

function getCustomerSessionAccessToken(config: PolarConfig): string {
  return config.POLAR_ACCESS_TOKEN ?? config.POLAR_CHECKOUT_TOKEN!;
}

function normalizeAppBaseUrl(appBaseUrl: string): string {
  return appBaseUrl.replace(/\/+$/, "");
}

function buildCheckoutCallbackUrl({
  appBaseUrl,
  path,
  locale,
  billing,
  workspaceCheckoutId,
}: {
  appBaseUrl: string;
  path:
    | "/billing/polar/success"
    | "/billing/polar/return"
    | "/workspace/checkout/success";
  locale: "ko" | "en";
  billing?: "success";
  workspaceCheckoutId?: string;
}) {
  const url = new URL(`${appBaseUrl}${path}`);
  url.searchParams.set("locale", locale);

  if (billing) {
    url.searchParams.set("billing", billing);
  }

  if (workspaceCheckoutId) {
    url.searchParams.set("workspace_checkout_id", workspaceCheckoutId);
  }

  if (path !== "/billing/polar/return") {
    url.searchParams.set("checkout_id", "{CHECKOUT_ID}");
  }

  return url.toString().replace("%7BCHECKOUT_ID%7D", "{CHECKOUT_ID}");
}

async function parsePolarResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new PolarApiError(response.status, await response.text());
  }

  return (await response.json()) as T;
}

export function isPolarRecoverableError(error: unknown): boolean {
  return (
    error instanceof PolarApiError &&
    [400, 401, 403, 404, 409, 422].includes(error.status)
  );
}

export function getPolarApiErrorInfo(
  error: unknown,
): { status: number; body: string } | null {
  if (!(error instanceof PolarApiError)) {
    return null;
  }

  return {
    status: error.status,
    body: error.body,
  };
}

export function createPolarBillingClient(
  env: Partial<{
    POLAR_ENV: string;
    POLAR_CHECKOUT_TOKEN: string;
    POLAR_ACCESS_TOKEN: string;
    APP_BASE_URL: string;
  }>,
): PolarBillingClient | null {
  const parsed = polarConfigSchema.safeParse(env);

  if (!parsed.success) {
    return null;
  }

  const config = parsed.data;
  const apiBaseUrl = getPolarApiBaseUrl(config.POLAR_ENV);
  const appBaseUrl = normalizeAppBaseUrl(config.APP_BASE_URL);

  return {
    environment: config.POLAR_ENV,

    async createCheckoutSession({
      productId,
      externalCustomerId,
      idempotencyKey,
      locale,
      metadata,
      seats,
      minSeats,
      maxSeats,
      successPath = "/billing/polar/success",
      workspaceCheckoutId,
    }) {
      const response = await fetch(`${apiBaseUrl}/checkouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getCheckoutAccessToken(config)}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          products: [productId],
          external_customer_id: externalCustomerId,
          ...(seats !== undefined ? { seats } : {}),
          ...(minSeats !== undefined ? { min_seats: minSeats } : {}),
          ...(maxSeats !== undefined ? { max_seats: maxSeats } : {}),
          success_url: buildCheckoutCallbackUrl({
            appBaseUrl,
            path: successPath,
            locale,
            billing:
              successPath === "/billing/polar/success" ? "success" : undefined,
            workspaceCheckoutId,
          }),
          return_url: buildCheckoutCallbackUrl({
            appBaseUrl,
            path: "/billing/polar/return",
            locale,
          }),
          metadata,
        }),
      });

      const data = await parsePolarResponse<CheckoutSessionResponse>(response);
      return { checkoutUrl: data.url, checkoutId: data.id ?? null };
    },

    async createCustomerSession(input) {
      const response = await fetch(`${apiBaseUrl}/customer-sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getCustomerSessionAccessToken(config)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          "customerId" in input
            ? {
                customer_id: input.customerId,
              }
            : {
                external_customer_id: input.externalCustomerId,
              },
        ),
      });

      const data = await parsePolarResponse<CustomerSessionResponse>(response);
      const customerPortalUrl =
        data.customerPortalUrl ?? data.customer_portal_url;

      if (!customerPortalUrl) {
        throw new Error("Polar customer session response is missing portal URL");
      }

      return { customerPortalUrl };
    },

    async getCheckoutSession({ checkoutId }) {
      const response = await fetch(`${apiBaseUrl}/checkouts/${checkoutId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getCheckoutAccessToken(config)}`,
          "Content-Type": "application/json",
        },
      });

      const data = await parsePolarResponse<CheckoutSessionDetailResponse>(
        response,
      );

      return {
        checkoutId: data.id,
        status: data.status ?? null,
        metadata: data.metadata ?? {},
        externalCustomerId:
          data.externalCustomerId ?? data.external_customer_id ?? null,
        subscriptionKey: data.subscriptionId ?? data.subscription_id ?? null,
        customerKey: data.customerId ?? data.customer_id ?? null,
        seats:
          typeof data.seats === "number" && Number.isFinite(data.seats)
            ? data.seats
            : null,
      };
    },

    async updateSubscriptionSeats({
      subscriptionId,
      seatCount,
      prorationBehavior,
    }) {
      const response = await fetch(`${apiBaseUrl}/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getCustomerSessionAccessToken(config)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seats: seatCount,
          proration_behavior: prorationBehavior,
        }),
      });

      const data = await parsePolarResponse<SubscriptionUpdateResponse>(
        response,
      );
      const pendingUpdate = data.pendingUpdate ?? data.pending_update ?? null;

      return {
        subscriptionId: data.id,
        seats:
          typeof data.seats === "number" && Number.isFinite(data.seats)
            ? data.seats
            : null,
        pendingSeats:
          typeof pendingUpdate?.seats === "number" &&
          Number.isFinite(pendingUpdate.seats)
            ? pendingUpdate.seats
            : null,
      };
    },
  };
}
