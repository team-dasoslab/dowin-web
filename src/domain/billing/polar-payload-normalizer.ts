const SENSITIVE_KEY_PATTERNS = [
  /card/i,
  /cvc/i,
  /cvv/i,
  /cid/i,
  /cav2/i,
  /pan/i,
  /^number$/i,
  /track/i,
  /^pin$/i,
  /pin_?block/i,
  /payment_?method/i,
  /token/i,
  /secret/i,
  /password/i,
  /authorization/i,
];

const ALLOWED_METADATA_KEYS = new Set([
  "workspaceId",
  "workspaceUid",
  "workspaceCheckoutId",
  "userId",
  "requestedByUserId",
  "adminUserId",
  "targetPlanCode",
  "requestedSeatCount",
  "termsVersion",
  "privacyPolicyVersion",
  "billingPolicyVersion",
  "checkoutNoticeVersion",
]);

const ALLOWED_DATA_KEYS = new Set([
  "id",
  "status",
  "customer_id",
  "customerId",
  "external_customer_id",
  "externalCustomerId",
  "external_id",
  "externalId",
  "subscription_id",
  "subscriptionId",
  "checkout_id",
  "checkoutId",
  "order_id",
  "orderId",
  "invoice_id",
  "invoiceId",
  "payment_id",
  "paymentId",
  "product_id",
  "productId",
  "price_id",
  "priceId",
  "amount",
  "total_amount",
  "totalAmount",
  "subtotal_amount",
  "subtotalAmount",
  "tax_amount",
  "taxAmount",
  "tax_rate",
  "taxRate",
  "tax_jurisdiction",
  "taxJurisdiction",
  "currency",
  "seats",
  "current_period_start",
  "currentPeriodStart",
  "current_period_end",
  "currentPeriodEnd",
  "cancel_at_period_end",
  "cancelAtPeriodEnd",
  "started_at",
  "startedAt",
  "ended_at",
  "endedAt",
  "ends_at",
  "endsAt",
  "paid_at",
  "paidAt",
  "refunded_at",
  "refundedAt",
  "refunded_amount",
  "refundedAmount",
  "receipt_url",
  "receiptUrl",
  "invoice_url",
  "invoiceUrl",
  "metadata",
  "customer",
  "subscription",
  "active_subscriptions",
  "activeSubscriptions",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizeMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const sanitized = Object.fromEntries(
    Object.entries(value).filter(
      ([key]) => ALLOWED_METADATA_KEYS.has(key) && !isSensitiveKey(key),
    ),
  );

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeObject(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      continue;
    }

    if (key === "metadata") {
      const metadata = sanitizeMetadata(child);
      if (metadata) {
        sanitized.metadata = metadata;
      }
      continue;
    }

    if (!ALLOWED_DATA_KEYS.has(key)) {
      continue;
    }

    const normalized = sanitizeValue(child);
    if (normalized !== undefined) {
      sanitized[key] = normalized;
    }
  }

  return sanitized;
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const sanitized = value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);
    return sanitized.length > 0 ? sanitized : undefined;
  }

  if (isRecord(value)) {
    const sanitized = sanitizeObject(value);
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return undefined;
}

export function normalizePolarBillingEventPayload(
  payload: unknown,
): Record<string, unknown> {
  if (!isRecord(payload)) {
    return {};
  }

  const data = isRecord(payload.data) ? sanitizeObject(payload.data) : {};

  return {
    type: typeof payload.type === "string" ? payload.type : null,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : null,
    data,
  };
}

export function stringifyNormalizedPolarPayload(payload: unknown): string {
  return JSON.stringify(normalizePolarBillingEventPayload(payload));
}

export function sanitizePolarLogBody(body: string): string {
  try {
    return stringifyNormalizedPolarPayload(JSON.parse(body));
  } catch {
    return "[unparseable Polar response body omitted]";
  }
}
