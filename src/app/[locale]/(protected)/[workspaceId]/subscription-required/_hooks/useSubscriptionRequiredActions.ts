"use client";

import { postWorkspacesWorkspaceIdBillingCheckout } from "@/api/generated/billing/billing";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const useSubscriptionRequiredActions = (workspaceId: string) => {
  const t = useTranslations("SubscriptionRequired");
  const { showToast } = useToast();
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);

  const startBasicCheckout = async () => {
    if (!workspaceId) {
      showToast("error", t("checkoutFailed"));
      return;
    }

    setIsCheckoutPending(true);
    try {
      const response = await postWorkspacesWorkspaceIdBillingCheckout(
        workspaceId,
        {
          returnTo: `${window.location.pathname}${window.location.search}`,
        },
        {
          headers: {
            "Idempotency-Key": createBillingCheckoutIdempotencyKey(),
          },
        },
      );

      if (response.status !== 201 || !response.data.checkoutUrl) {
        showToast("error", t("checkoutUnavailable"));
        return;
      }

      trackEvent("workspace_checkout_started", {
        checkout_method: "basic_resubscribe_checkout",
      });
      window.location.assign(response.data.checkoutUrl);
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("checkoutFailed")));
    } finally {
      setIsCheckoutPending(false);
    }
  };

  return {
    isCheckoutPending,
    startBasicCheckout,
  };
};

function createBillingCheckoutIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `billing_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
