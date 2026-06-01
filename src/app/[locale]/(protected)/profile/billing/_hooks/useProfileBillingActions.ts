"use client";

import { getGetWorkspacesWorkspaceIdBillingMeQueryKey } from "@/api/generated/billing/billing";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const useProfileBillingActions = (workspaceIdOverride?: string) => {
  const t = useTranslations("ProfileBilling");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: workspaceResponse } = useGetWorkspacesMe();
  const workspaceId =
    workspaceIdOverride ??
    (workspaceResponse?.status === 200 ? (workspaceResponse?.data?.id ?? "") : "");
  const [isPortalPending, setIsPortalPending] = useState(false);

  const openPortal = async () => {
    if (!workspaceId) {
      showToast("error", t("portalFailed"));
      return;
    }

    try {
      setIsPortalPending(true);
      window.location.assign(`/api/workspaces/${workspaceId}/billing/portal`);
    } catch (error) {
      setIsPortalPending(false);
      showToast("error", getApiErrorMessage(error, t("portalFailed")));
    }
  };

  const handleReturnedFromCheckout = async () => {
    showToast("info", t("checkoutPending"));
    if (workspaceId) {
      await queryClient.invalidateQueries({
        queryKey: getGetWorkspacesWorkspaceIdBillingMeQueryKey(workspaceId),
      });
    }
  };

  return {
    openPortal,
    handleReturnedFromCheckout,
    isPortalPending,
  };
};
