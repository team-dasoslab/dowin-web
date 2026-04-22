"use client";

import { postBillingCheckout } from "@/api/generated/billing/billing";
import { useToast } from "@/context/ToastContext";
import type { Locale } from "@/i18n/detect-locale";
import {
  getApiErrorCode,
  getApiErrorMessage,
} from "@/lib/client/frontend-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

export function useProfileBillingActions() {
  const t = useTranslations("ProfileBilling");
  const locale = useLocale() as Locale;
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await postBillingCheckout(
        { locale },
        {
          headers: {
            "Idempotency-Key": crypto.randomUUID(),
          },
        },
      );

      if (response.status !== 200) {
        throw response;
      }

      return response.data;
    },
    onSuccess: (data) => {
      window.location.assign(data.checkoutUrl);
    },
    onError: (error) => {
      const errorCode = getApiErrorCode(error);
      const message =
        errorCode === "BILLING_NOT_READY"
          ? t("checkoutUnavailable")
          : errorCode === "BILLING_REVIEW_REQUIRED"
            ? t("checkoutReviewRequired")
            : getApiErrorMessage(error, t("checkoutFailed"));

      showToast("error", message);
    },
  });

  const openPortal = async () => {
    window.location.assign("/api/billing/portal");
  };

  const handleReturnedFromCheckout = async () => {
    showToast("info", t("checkoutPending"));
    await queryClient.invalidateQueries({
      queryKey: ["/api/billing/me"],
    });
  };

  return {
    openPortal,
    startCheckout: () => checkoutMutation.mutate(),
    handleReturnedFromCheckout,
    isCheckoutPending: checkoutMutation.isPending,
  };
}
