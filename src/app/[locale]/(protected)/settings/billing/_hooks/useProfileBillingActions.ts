"use client";

import { getGetWorkspacesWorkspaceIdBillingMeQueryKey } from "@/api/generated/billing/billing";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { getFetchErrorMessage } from "@/lib/client/frontend-api";
import { openNewTab } from "@/lib/client/open-new-tab";
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
    (workspaceResponse?.status === 200
      ? (workspaceResponse?.data?.id ?? "")
      : "");
  const [isPortalPending, setIsPortalPending] = useState(false);

  const openPortal = async () => {
    if (!workspaceId) {
      showToast("error", t("portalFailed"));
      return;
    }

    try {
      setIsPortalPending(true);
      const response = await fetch(
        `/api/workspaces/${workspaceId}/billing/portal`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        showToast(
          "error",
          await getFetchErrorMessage(response, t("portalFailed")),
        );
        return;
      }

      const data = (await response.json()) as { portalUrl?: string };
      if (!data.portalUrl) {
        showToast("error", t("portalFailed"));
        return;
      }

      const portalWindow = openNewTab(
        data.portalUrl,
      );
      if (!portalWindow) {
        showToast("error", t("portalFailed"));
      }
    } catch {
      showToast("error", t("portalFailed"));
    } finally {
      setIsPortalPending(false);
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
