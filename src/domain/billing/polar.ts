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

export type PolarBillingClient = {
  environment: "sandbox" | "production";
  createCheckoutSession(input: {
    productId: string;
    externalCustomerId: string;
    idempotencyKey: string;
    locale: "ko" | "en";
    metadata: Record<string, string>;
  }): Promise<{ checkoutUrl: string }>;
  createCustomerSession(
    input:
      | {
          customerId: string;
        }
      | {
          externalCustomerId: string;
        },
  ): Promise<{ customerPortalUrl: string }>;
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
}: {
  appBaseUrl: string;
  path: "/billing/polar/success" | "/billing/polar/return";
  locale: "ko" | "en";
  billing?: "success";
}) {
  const url = new URL(`${appBaseUrl}${path}`);
  url.searchParams.set("locale", locale);

  if (billing) {
    url.searchParams.set("billing", billing);
  }

  return url.toString();
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
          success_url: buildCheckoutCallbackUrl({
            appBaseUrl,
            path: "/billing/polar/success",
            locale,
            billing: "success",
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
      return { checkoutUrl: data.url };
    },

    async createCustomerSession(input) {
      const response = await fetch(`${apiBaseUrl}/customer-sessions/`, {
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
  };
}
