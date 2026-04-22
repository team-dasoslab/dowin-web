import { z } from "zod";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";

type BillingPort = Pick<
  BillingStorage,
  | "findBillingEventByProviderEventId"
  | "findWorkspaceById"
  | "findWorkspaceByCustomerExternalRef"
  | "appendBillingEvent"
  | "upsertWorkspaceBillingState"
  | "updateWorkspaceBillingProjection"
>;

const polarWebhookEnvelopeSchema = z.object({
  type: z.string().trim().min(1),
  timestamp: z.string().trim().min(1),
  data: z.record(z.string(), z.unknown()),
});

type WebhookEnvelope = z.infer<typeof polarWebhookEnvelopeSchema>;

type BillingProjection = {
  billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
  planCode: "FREE" | "STANDARD";
  customerKey: string | null;
  customerExternalRef: string | null;
  subscriptionKey: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  billingOwnerUserId: number | null;
};

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

function parseWorkspaceIdFromExternalRef(value: string | null): number | null {
  if (!value?.startsWith("workspace:")) {
    return null;
  }

  const parsed = Number(value.slice("workspace:".length));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function pickCustomerExternalRef(payload: WebhookEnvelope): string | null {
  if (payload.type === "customer.state_changed") {
    return (
      asString(payload.data.external_id) ??
      asString(payload.data.externalId) ??
      null
    );
  }

  const customer = asRecord(payload.data.customer);
  return (
    asString(customer?.external_id) ??
    asString(customer?.externalId) ??
    asString(payload.data.external_customer_id) ??
    null
  );
}

function pickBillingOwnerUserId(payload: WebhookEnvelope): number | null {
  const metadata = asRecord(payload.data.metadata);
  return (
    asNumber(metadata?.adminUserId) ??
    asNumber(metadata?.requestedByUserId) ??
    null
  );
}

function resolveProjection(
  payload: WebhookEnvelope,
  now: Date,
): BillingProjection | null {
  const customer = asRecord(payload.data.customer);
  const customerKey =
    asString(payload.data.customer_id) ?? asString(customer?.id) ?? null;
  const customerExternalRef = pickCustomerExternalRef(payload);
  const billingOwnerUserId = pickBillingOwnerUserId(payload);

  if (payload.type === "customer.state_changed") {
    const activeSubscriptions = Array.isArray(payload.data.active_subscriptions)
      ? payload.data.active_subscriptions
      : [];
    const activeSubscription = asRecord(activeSubscriptions[0]);

    if (!activeSubscription) {
      return {
        billingStatus: "EXPIRED",
        planCode: "FREE",
        customerKey: asString(payload.data.id),
        customerExternalRef,
        subscriptionKey: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingOwnerUserId,
      };
    }

    const currentPeriodEnd = asDate(activeSubscription.current_period_end);
    const cancelAtPeriodEnd =
      asBoolean(activeSubscription.cancel_at_period_end) ?? false;

    return {
      billingStatus: cancelAtPeriodEnd ? "CANCELED" : "ACTIVE",
      planCode:
        cancelAtPeriodEnd && currentPeriodEnd && currentPeriodEnd <= now
          ? "FREE"
          : "STANDARD",
      customerKey: asString(payload.data.id),
      customerExternalRef,
      subscriptionKey: asString(activeSubscription.id),
      currentPeriodEnd,
      cancelAtPeriodEnd,
      billingOwnerUserId,
    };
  }

  const currentPeriodEnd = asDate(payload.data.current_period_end);
  const cancelAtPeriodEnd = asBoolean(payload.data.cancel_at_period_end) ?? false;
  const subscriptionKey =
    asString(payload.data.subscription_id) ?? asString(payload.data.id) ?? null;

  switch (payload.type) {
    case "subscription.active":
      return {
        billingStatus: "ACTIVE",
        planCode: "STANDARD",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        billingOwnerUserId,
      };
    case "subscription.canceled":
      return {
        billingStatus:
          currentPeriodEnd && currentPeriodEnd <= now ? "EXPIRED" : "CANCELED",
        planCode:
          currentPeriodEnd && currentPeriodEnd <= now ? "FREE" : "STANDARD",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd: true,
        billingOwnerUserId,
      };
    case "subscription.ended":
      return {
        billingStatus: "EXPIRED",
        planCode: "FREE",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        billingOwnerUserId,
      };
    case "subscription.updated": {
      const rawStatus = asString(payload.data.status);
      const endedAt = asDate(payload.data.ended_at) ?? asDate(payload.data.ends_at);

      if (rawStatus === "unpaid" || rawStatus === "revoked") {
        return {
          billingStatus: "REVOKED",
          planCode: "FREE",
          customerKey,
          customerExternalRef,
          subscriptionKey,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          billingOwnerUserId,
        };
      }

      if (endedAt && endedAt <= now) {
        return {
          billingStatus: "EXPIRED",
          planCode: "FREE",
          customerKey,
          customerExternalRef,
          subscriptionKey,
          currentPeriodEnd: endedAt,
          cancelAtPeriodEnd,
          billingOwnerUserId,
        };
      }

      return {
        billingStatus: cancelAtPeriodEnd ? "CANCELED" : "ACTIVE",
        planCode: "STANDARD",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        billingOwnerUserId,
      };
    }
    case "subscription.revoked":
      return {
        billingStatus: "REVOKED",
        planCode: "FREE",
        customerKey,
        customerExternalRef,
        subscriptionKey,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        billingOwnerUserId,
      };
    case "order.refunded": {
      const refundedAmount = asNumber(payload.data.refunded_amount) ?? 0;
      const totalAmount = asNumber(payload.data.total_amount) ?? 0;

      if (totalAmount > 0 && refundedAmount >= totalAmount) {
        return {
          billingStatus: "REVOKED",
          planCode: "FREE",
          customerKey,
          customerExternalRef,
          subscriptionKey,
          currentPeriodEnd,
          cancelAtPeriodEnd,
          billingOwnerUserId,
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

  async handleWebhook(input: {
    providerEventId: string;
    payloadJson: string;
    now?: Date;
  }) {
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
    const existingEvent =
      await this.billingStorage.findBillingEventByProviderEventId(
        input.providerEventId,
      );

    if (existingEvent) {
      return { status: "ignored" as const };
    }

    const customerExternalRef = pickCustomerExternalRef(payload);
    const workspaceIdFromExternalRef =
      parseWorkspaceIdFromExternalRef(customerExternalRef);
    const workspaceIdFromMetadata = asNumber(
      asRecord(payload.data.metadata)?.workspaceId,
    );
    const workspace =
      (workspaceIdFromMetadata
        ? await this.billingStorage.findWorkspaceById(workspaceIdFromMetadata)
        : null) ??
      (workspaceIdFromExternalRef
        ? await this.billingStorage.findWorkspaceById(workspaceIdFromExternalRef)
        : null) ??
      (customerExternalRef
        ? await this.billingStorage.findWorkspaceByCustomerExternalRef(
            customerExternalRef,
          )
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

    const event = await this.billingStorage.appendBillingEvent({
      workspaceId: workspace.id,
      providerEventId: input.providerEventId,
      eventType: payload.type,
      customerKey,
      subscriptionKey,
      occurredAt,
      payloadJson: input.payloadJson,
      status: projection ? "ACCEPTED" : "IGNORED",
    });

    if (!projection) {
      return { status: "accepted" as const };
    }

    await this.billingStorage.upsertWorkspaceBillingState({
      workspaceId: workspace.id,
      billingStatus: projection.billingStatus,
      planCode: projection.planCode,
      customerKey: projection.customerKey,
      subscriptionKey: projection.subscriptionKey,
      currentPeriodEnd: projection.currentPeriodEnd,
      cancelAtPeriodEnd: projection.cancelAtPeriodEnd,
      billingOwnerUserId:
        projection.billingOwnerUserId ?? workspace.billingOwnerUserId ?? null,
      lastEventId: event.id,
      lastEventOccurredAt: occurredAt,
    });

    await this.billingStorage.updateWorkspaceBillingProjection({
      workspaceId: workspace.id,
      planCode: projection.planCode,
      billingCustomerExternalRef:
        projection.customerExternalRef ??
        workspace.billingCustomerExternalRef ??
        null,
      billingOwnerUserId:
        projection.billingOwnerUserId ?? workspace.billingOwnerUserId ?? null,
    });

    return { status: "accepted" as const };
  }
}
