import { stringifyNormalizedPolarPayload } from "@/domain/billing/polar-payload-normalizer";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import {
  type BillingPlanCode,
  type BillingStatus,
  type EntitlementSource,
} from "@/domain/billing/types";
import { z } from "zod";

type BillingPort = Pick<
  BillingStorage,
  | "findBillingEventByProviderEventId"
  | "findWorkspaceById"
  | "findWorkspaceByCustomerExternalRef"
  | "recordPolarWebhookBillingEvent"
>;

const polarWebhookEnvelopeSchema = z.object({
  type: z.string().trim().min(1),
  timestamp: z.string().trim().min(1),
  data: z.record(z.string(), z.unknown()),
});

type WebhookEnvelope = z.infer<typeof polarWebhookEnvelopeSchema>;

type BillingProjection = {
  billingStatus: BillingStatus;
  planCode: BillingPlanCode;
  entitlementSource: EntitlementSource;
  customerKey: string | null;
  customerExternalRef: string | null;
  subscriptionKey: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  billingOwnerUserId: number | null;
  purchasedSeatCount: number | null;
};

function getRiskReviewFailureReason(input: {
  eventType: string;
  currentPeriodEnd: Date | null;
  occurredAt: Date;
  projection: BillingProjection | null;
}): string | null {
  if (input.eventType === "order.refunded" && !input.projection) {
    return "PARTIAL_REFUND_RISK_SIGNAL";
  }

  if (input.eventType !== "subscription.revoked") {
    return null;
  }

  if (!input.currentPeriodEnd || input.currentPeriodEnd > input.occurredAt) {
    return "RISK_REVIEW_SIGNAL";
  }

  return null;
}

function getBillingEventStatus(eventType: string, projection: BillingProjection | null) {
  if (projection || eventType === "order.refunded") {
    return "ACCEPTED";
  }

  return "IGNORED";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  return null;
}

function asPositiveInteger(value: unknown): number | null {
  const number = asNumber(value);
  return number !== null && Number.isInteger(number) && number > 0 ? number : null;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}

function pickMetadataWithAny(keys: string[], ...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    const metadata = asRecord(value);
    if (metadata && keys.some((key) => metadata[key] !== undefined)) {
      return metadata;
    }
  }

  return values.map(asRecord).find((metadata) => metadata !== null) ?? null;
}

function parseWorkspaceIdFromExternalRef(value: string | null): number | null {
  if (!value?.startsWith("workspace:")) {
    return null;
  }

  const parsed = Number(value.slice("workspace:".length));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getActiveSubscription(payload: WebhookEnvelope) {
  if (payload.type !== "customer.state_changed") {
    return null;
  }

  const activeSubscriptions = Array.isArray(payload.data.active_subscriptions)
    ? payload.data.active_subscriptions
    : [];

  return asRecord(activeSubscriptions[0]);
}

function pickWorkspaceCheckoutExternalRef(payload: WebhookEnvelope): string | null {
  const metadata = pickMetadataWithAny(
    ["workspaceCheckoutId"],
    payload.data.metadata,
    getActiveSubscription(payload)?.metadata,
  );
  const workspaceCheckoutId = asString(metadata?.workspaceCheckoutId);

  return workspaceCheckoutId ? `workspace-checkout:${workspaceCheckoutId}` : null;
}

function pickCustomerExternalRef(payload: WebhookEnvelope): string | null {
  const workspaceCheckoutExternalRef = pickWorkspaceCheckoutExternalRef(payload);
  if (workspaceCheckoutExternalRef) {
    return workspaceCheckoutExternalRef;
  }

  if (payload.type === "customer.state_changed") {
    return asString(payload.data.external_id) ?? asString(payload.data.externalId) ?? null;
  }

  const customer = asRecord(payload.data.customer);
  return (
    asString(customer?.external_id) ??
    asString(customer?.externalId) ??
    asString(payload.data.external_customer_id) ??
    null
  );
}

function pickBillingOwnerUserId(
  payload: WebhookEnvelope,
  subscription?: Record<string, unknown> | null,
): number | null {
  const metadata = pickMetadataWithAny(
    ["adminUserId", "requestedByUserId"],
    payload.data.metadata,
    subscription?.metadata,
  );
  return asNumber(metadata?.adminUserId) ?? asNumber(metadata?.requestedByUserId) ?? null;
}

function pickPaidPlanCode(
  payload: WebhookEnvelope,
  subscription?: Record<string, unknown> | null,
): "BASIC" | "STANDARD" {
  const metadata = pickMetadataWithAny(
    ["targetPlanCode"],
    payload.data.metadata,
    subscription?.metadata,
  );
  return metadata?.targetPlanCode === "STANDARD" ? "STANDARD" : "BASIC";
}

function pickPurchasedSeatCount(
  payload: WebhookEnvelope,
  subscription?: Record<string, unknown> | null,
): number | null {
  const metadata = pickMetadataWithAny(
    ["requestedSeatCount"],
    payload.data.metadata,
    subscription?.metadata,
  );

  return (
    asPositiveInteger(payload.data.seats) ??
    asPositiveInteger(subscription?.seats) ??
    asPositiveInteger(metadata?.requestedSeatCount) ??
    null
  );
}

function asPlanCode(value: unknown): BillingPlanCode | null {
  return value === "BASIC" || value === "FREE" || value === "STANDARD" ? value : null;
}

function pickFirstString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function createRetentionRecordInput(input: {
  providerEventId: string;
  payload: WebhookEnvelope;
  projection: BillingProjection | null;
  workspace: {
    id: number;
    uid?: string | null;
    name?: string | null;
    planCode: BillingPlanCode;
    billingOwnerUserId?: number | null;
  };
  occurredAt: Date;
  normalizedPayloadJson: string;
}) {
  const metadata = pickMetadataWithAny(
    [
      "termsVersion",
      "privacyPolicyVersion",
      "billingPolicyVersion",
      "checkoutNoticeVersion",
      "requestedSeatCount",
      "targetPlanCode",
    ],
    input.payload.data.metadata,
    getActiveSubscription(input.payload)?.metadata,
  );
  const activeSubscription = getActiveSubscription(input.payload);
  const customer = asRecord(input.payload.data.customer);
  const subscription = asRecord(input.payload.data.subscription);
  const currentPeriodStart =
    asDate(input.payload.data.current_period_start) ??
    asDate(input.payload.data.currentPeriodStart) ??
    asDate(subscription?.current_period_start) ??
    asDate(subscription?.currentPeriodStart);
  const currentPeriodEnd =
    input.projection?.currentPeriodEnd ??
    asDate(input.payload.data.current_period_end) ??
    asDate(input.payload.data.currentPeriodEnd) ??
    asDate(subscription?.current_period_end) ??
    asDate(subscription?.currentPeriodEnd);

  return {
    providerEventId: input.providerEventId,
    eventType: input.payload.type,
    eventOccurredAt: input.occurredAt,
    workspaceIdSnapshot: input.workspace.id,
    workspaceUidSnapshot: input.workspace.uid ?? null,
    workspaceNameSnapshot: input.workspace.name ?? null,
    billingOwnerUserIdSnapshot:
      input.projection?.billingOwnerUserId ?? input.workspace.billingOwnerUserId ?? null,
    planCode:
      asPlanCode(metadata?.targetPlanCode) ??
      (input.workspace.planCode === "BASIC" || input.workspace.planCode === "STANDARD"
        ? input.workspace.planCode
        : (input.projection?.planCode ?? "FREE")),
    seatCount:
      pickPurchasedSeatCount(input.payload, activeSubscription) ??
      pickPurchasedSeatCount(input.payload) ??
      (input.projection?.purchasedSeatCount && input.projection.purchasedSeatCount > 0
        ? input.projection.purchasedSeatCount
        : null) ??
      null,
    currency: pickFirstString(input.payload.data, ["currency"]),
    amount:
      asNumber(input.payload.data.amount) ??
      asNumber(input.payload.data.total_amount) ??
      asNumber(input.payload.data.totalAmount),
    taxAmount: asNumber(input.payload.data.tax_amount) ?? asNumber(input.payload.data.taxAmount),
    taxRate: pickFirstString(input.payload.data, ["tax_rate", "taxRate"]),
    taxJurisdiction: pickFirstString(input.payload.data, ["tax_jurisdiction", "taxJurisdiction"]),
    customerKey:
      input.projection?.customerKey ??
      asString(input.payload.data.customer_id) ??
      asString(input.payload.data.customerId) ??
      asString(customer?.id) ??
      null,
    subscriptionKey:
      input.projection?.subscriptionKey ??
      asString(input.payload.data.subscription_id) ??
      asString(input.payload.data.subscriptionId) ??
      asString(subscription?.id) ??
      asString(input.payload.data.id) ??
      null,
    checkoutId: pickFirstString(input.payload.data, ["checkout_id", "checkoutId"]),
    orderId: pickFirstString(input.payload.data, ["order_id", "orderId"]),
    invoiceId: pickFirstString(input.payload.data, ["invoice_id", "invoiceId"]),
    paymentId: pickFirstString(input.payload.data, ["payment_id", "paymentId"]),
    receiptUrl: pickFirstString(input.payload.data, [
      "receipt_url",
      "receiptUrl",
      "invoice_url",
      "invoiceUrl",
    ]),
    currentPeriodStart,
    currentPeriodEnd,
    paidAt: asDate(input.payload.data.paid_at) ?? asDate(input.payload.data.paidAt),
    refundedAt: asDate(input.payload.data.refunded_at) ?? asDate(input.payload.data.refundedAt),
    canceledAt: asDate(input.payload.data.canceled_at) ?? asDate(input.payload.data.canceledAt),
    termsVersion: asString(metadata?.termsVersion),
    privacyPolicyVersion: asString(metadata?.privacyPolicyVersion),
    billingPolicyVersion: asString(metadata?.billingPolicyVersion),
    checkoutNoticeVersion: asString(metadata?.checkoutNoticeVersion),
    normalizedPayloadJson: input.normalizedPayloadJson,
    legalRetentionUntil: addYears(input.occurredAt, 10),
  };
}

function resolveProjection(payload: WebhookEnvelope, now: Date): BillingProjection | null {
  const customer = asRecord(payload.data.customer);
  const customerKey = asString(payload.data.customer_id) ?? asString(customer?.id) ?? null;
  const customerExternalRef = pickCustomerExternalRef(payload);

  if (payload.type === "customer.state_changed") {
    const activeSubscription = getActiveSubscription(payload);

    if (!activeSubscription) {
      const billingOwnerUserId = pickBillingOwnerUserId(payload);
      return {
        billingStatus: "EXPIRED",
        planCode: "FREE",
        entitlementSource: "POLAR",
        customerKey: asString(payload.data.id),
        customerExternalRef,
        subscriptionKey: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingOwnerUserId,
        purchasedSeatCount: null,
      };
    }

    const currentPeriodEnd = asDate(activeSubscription.current_period_end);
    const cancelAtPeriodEnd = asBoolean(activeSubscription.cancel_at_period_end) ?? false;
    const billingOwnerUserId = pickBillingOwnerUserId(payload, activeSubscription);
    const paidPlanCode = pickPaidPlanCode(payload, activeSubscription);
    const purchasedSeatCount =
      paidPlanCode === "BASIC" ? pickPurchasedSeatCount(payload, activeSubscription) : null;

    return {
      billingStatus:
        cancelAtPeriodEnd && currentPeriodEnd && currentPeriodEnd <= now
          ? "EXPIRED"
          : cancelAtPeriodEnd
            ? "CANCELED"
            : "ACTIVE",
      planCode:
        cancelAtPeriodEnd && currentPeriodEnd && currentPeriodEnd <= now ? "FREE" : paidPlanCode,
      entitlementSource: "POLAR",
      customerKey: asString(payload.data.id),
      customerExternalRef,
      subscriptionKey: asString(activeSubscription.id),
      currentPeriodEnd,
      cancelAtPeriodEnd,
      billingOwnerUserId,
      purchasedSeatCount,
    };
  }

  const currentPeriodEnd = asDate(payload.data.current_period_end);
  const cancelAtPeriodEnd = asBoolean(payload.data.cancel_at_period_end) ?? false;
  const subscriptionKey =
    asString(payload.data.subscription_id) ?? asString(payload.data.id) ?? null;
  const billingOwnerUserId = pickBillingOwnerUserId(payload);
  const paidPlanCode = pickPaidPlanCode(payload);
  const purchasedSeatCount = paidPlanCode === "BASIC" ? pickPurchasedSeatCount(payload) : null;

  switch (payload.type) {
    case "subscription.active":
      return {
        billingStatus: "ACTIVE",
        planCode: paidPlanCode,
        entitlementSource: "POLAR",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        billingOwnerUserId,
        purchasedSeatCount,
      };
    case "subscription.canceled":
      return {
        billingStatus: currentPeriodEnd && currentPeriodEnd <= now ? "EXPIRED" : "CANCELED",
        planCode: currentPeriodEnd && currentPeriodEnd <= now ? "FREE" : paidPlanCode,
        entitlementSource: "POLAR",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd: true,
        billingOwnerUserId,
        purchasedSeatCount,
      };
    case "subscription.uncanceled":
      return {
        billingStatus: "ACTIVE",
        planCode: paidPlanCode,
        entitlementSource: "POLAR",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        billingOwnerUserId,
        purchasedSeatCount,
      };
    case "subscription.ended":
      return {
        billingStatus: "EXPIRED",
        planCode: "FREE",
        entitlementSource: "POLAR",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        billingOwnerUserId,
        purchasedSeatCount: paidPlanCode === "BASIC" ? 0 : null,
      };
    case "subscription.updated": {
      const rawStatus = asString(payload.data.status);
      const endedAt = asDate(payload.data.ended_at) ?? asDate(payload.data.ends_at);

      if (rawStatus === "unpaid" || rawStatus === "revoked") {
        return {
          billingStatus: "REVOKED",
          planCode: "FREE",
          entitlementSource: "POLAR",
          customerKey,
          customerExternalRef,
          subscriptionKey,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          billingOwnerUserId,
          purchasedSeatCount: paidPlanCode === "BASIC" ? 0 : null,
        };
      }

      if (endedAt && endedAt <= now) {
        return {
          billingStatus: "EXPIRED",
          planCode: "FREE",
          entitlementSource: "POLAR",
          customerKey,
          customerExternalRef,
          subscriptionKey,
          currentPeriodEnd: endedAt,
          cancelAtPeriodEnd,
          billingOwnerUserId,
          purchasedSeatCount: paidPlanCode === "BASIC" ? 0 : null,
        };
      }

      if (rawStatus === "past_due") {
        return {
          billingStatus: "ACTIVE",
          planCode: paidPlanCode,
          entitlementSource: "POLAR",
          customerKey,
          customerExternalRef,
          subscriptionKey,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          billingOwnerUserId,
          purchasedSeatCount,
        };
      }

      return {
        billingStatus: cancelAtPeriodEnd ? "CANCELED" : "ACTIVE",
        planCode: paidPlanCode,
        entitlementSource: "POLAR",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        billingOwnerUserId,
        purchasedSeatCount,
      };
    }
    case "subscription.revoked":
      return {
        billingStatus: "REVOKED",
        planCode: "FREE",
        entitlementSource: "POLAR",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        billingOwnerUserId,
        purchasedSeatCount: paidPlanCode === "BASIC" ? 0 : null,
      };
    case "order.refunded": {
      const refundedAmount = asNumber(payload.data.refunded_amount) ?? 0;
      const totalAmount = asNumber(payload.data.total_amount) ?? 0;

      if (totalAmount > 0 && refundedAmount >= totalAmount) {
        return {
          billingStatus: "REVOKED",
          planCode: "FREE",
          entitlementSource: "POLAR",
          customerKey,
          customerExternalRef,
          subscriptionKey,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          billingOwnerUserId,
          purchasedSeatCount: paidPlanCode === "BASIC" ? 0 : null,
        };
      }

      return null;
    }
    default:
      return null;
  }
}

export class PolarWebhookService {
  constructor(private billingStorage: BillingPort) {}

  async handleWebhook(input: { providerEventId: string; payloadJson: string; now?: Date }) {
    let parsedPayload: unknown;

    try {
      parsedPayload = JSON.parse(input.payloadJson);
    } catch {
      return { status: "ignored" as const };
    }

    const parsedEnvelope = polarWebhookEnvelopeSchema.safeParse(parsedPayload);

    if (!parsedEnvelope.success) {
      return { status: "ignored" as const };
    }

    const payload = parsedEnvelope.data;
    const existingEvent = await this.billingStorage.findBillingEventByProviderEventId(
      input.providerEventId,
    );

    if (existingEvent) {
      return { status: "ignored" as const };
    }

    const customerExternalRef = pickCustomerExternalRef(payload);
    const workspaceIdFromExternalRef = parseWorkspaceIdFromExternalRef(customerExternalRef);
    const workspaceCheckoutExternalRef = pickWorkspaceCheckoutExternalRef(payload);
    const workspaceIdFromMetadata = asNumber(asRecord(payload.data.metadata)?.workspaceId);
    const workspace =
      (workspaceIdFromMetadata
        ? await this.billingStorage.findWorkspaceById(workspaceIdFromMetadata)
        : null) ??
      (workspaceIdFromExternalRef
        ? await this.billingStorage.findWorkspaceById(workspaceIdFromExternalRef)
        : null) ??
      (workspaceCheckoutExternalRef
        ? await this.billingStorage.findWorkspaceByCustomerExternalRef(workspaceCheckoutExternalRef)
        : null) ??
      (customerExternalRef
        ? await this.billingStorage.findWorkspaceByCustomerExternalRef(customerExternalRef)
        : null);

    if (!workspace) {
      return { status: "ignored" as const };
    }

    const now = input.now ?? new Date();
    const occurredAt = asDate(payload.timestamp) ?? now;
    const projection = resolveProjection(payload, now);
    const customerKey =
      projection?.customerKey ??
      asString(payload.data.customer_id) ??
      asString(asRecord(payload.data.customer)?.id) ??
      null;
    const subscriptionKey =
      projection?.subscriptionKey ??
      asString(payload.data.subscription_id) ??
      asString(payload.data.id) ??
      null;
    const normalizedPayloadJson = stringifyNormalizedPolarPayload(payload);

    const nextPurchasedSeatCount =
      projection?.purchasedSeatCount ??
      (projection?.planCode === "FREE" && workspace.planCode === "BASIC" ? 0 : null);

    const event = await this.billingStorage.recordPolarWebhookBillingEvent({
      event: {
        workspaceId: workspace.id,
        providerEventId: input.providerEventId,
        eventType: payload.type,
        customerKey,
        subscriptionKey,
        occurredAt,
        payloadJson: normalizedPayloadJson,
        status: getBillingEventStatus(payload.type, projection),
        failureReason: getRiskReviewFailureReason({
          eventType: payload.type,
          currentPeriodEnd: projection?.currentPeriodEnd ?? null,
          occurredAt,
          projection,
        }),
      },
      retention: createRetentionRecordInput({
        providerEventId: input.providerEventId,
        payload,
        projection,
        workspace,
        occurredAt,
        normalizedPayloadJson,
      }),
      projection: projection
        ? {
            billingStatus: projection.billingStatus,
            planCode: projection.planCode,
            entitlementSource: projection.entitlementSource,
            customerKey: projection.customerKey,
            subscriptionKey: projection.subscriptionKey,
            currentPeriodEnd: projection.currentPeriodEnd,
            cancelAtPeriodEnd: projection.cancelAtPeriodEnd,
            billingOwnerUserId:
              projection.billingOwnerUserId ?? workspace.billingOwnerUserId ?? null,
            lastEventOccurredAt: occurredAt,
            workspaceBillingCustomerExternalRef:
              projection.customerExternalRef ?? workspace.billingCustomerExternalRef ?? null,
            workspaceBillingOwnerUserId:
              projection.billingOwnerUserId ?? workspace.billingOwnerUserId ?? null,
            purchasedSeatCount: nextPurchasedSeatCount,
          }
        : undefined,
    });

    if (!event) {
      return { status: "ignored" as const };
    }

    if (!projection) {
      return { status: "accepted" as const };
    }

    return { status: "accepted" as const };
  }
}
