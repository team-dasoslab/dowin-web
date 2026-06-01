"use client";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { useSubscriptionRequiredActions } from "@/app/[locale]/(protected)/[workspaceId]/subscription-required/_hooks/useSubscriptionRequiredActions";
import { useProfileBillingActions } from "@/app/[locale]/(protected)/workspace/billing/_hooks/useProfileBillingActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/routing";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { CreditCard, LifeBuoy, RotateCw, Settings, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function SubscriptionRequiredPage() {
  const t = useTranslations("SubscriptionRequired");
  const workspaceId = useParams().workspaceId as string;
  const { data: billingResponse } = useGetWorkspacesWorkspaceIdBillingMe(
    workspaceId,
    {
      query: {
        enabled: Boolean(workspaceId),
        retry: false,
      },
    },
  );
  const billing =
    billingResponse?.status === 200 ? billingResponse.data : null;
  const { openPortal, isPortalPending } = useProfileBillingActions(workspaceId);
  const { startBasicCheckout, isCheckoutPending } =
    useSubscriptionRequiredActions(workspaceId);
  const canManageBilling = Boolean(billing?.canManageBilling);
  const billingStatus = billing?.billingStatus ?? "NONE";
  const canStartCheckout =
    canManageBilling &&
    !billing?.requiresManualReview &&
    (billingStatus === "NONE" || billingStatus === "EXPIRED");
  const canOpenPortal =
    canManageBilling &&
    billing?.entitlementSource === "POLAR" &&
    (billingStatus === "ACTIVE" ||
      billingStatus === "CANCELED" ||
      billingStatus === "EXPIRED");

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <ProtectedPageContainer className="space-y-6 lg:space-y-8">
        <ProtectedPageHeader
          title={t("title")}
          description={t("description")}
        />

        <Card className="space-y-6 border-zinc-200 bg-white p-5 md:p-6">
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400">
              {billing?.workspaceName ?? t("workspaceFallback")}
            </p>
            <h2 className="text-xl font-black tracking-tight text-zinc-900">
              {canManageBilling ? t("adminTitle") : t("memberTitle")}
            </h2>
            <p className="text-sm leading-6 text-zinc-600">
              {canManageBilling ? t("adminDescription") : t("memberDescription")}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {canStartCheckout ? (
              <Button
                className="w-full justify-start gap-2 bg-primary px-4 py-3 text-sm font-bold text-white"
                disabled={isCheckoutPending}
                onClick={() => {
                  void startBasicCheckout();
                }}
              >
                <RotateCw className="size-4" />
                {isCheckoutPending ? t("checkoutLoading") : t("checkoutAction")}
              </Button>
            ) : (
              <Button
                asChild
                className="w-full justify-start gap-2 bg-primary px-4 py-3 text-sm font-bold text-white"
              >
                <Link href={getWorkspacePath(workspaceId, "/workspace/billing")}>
                  <CreditCard className="size-4" />
                  {t("billingAction")}
                </Link>
              </Button>
            )}
            {canOpenPortal ? (
              <Button
                className="w-full justify-start gap-2 border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-800"
                disabled={isPortalPending}
                onClick={() => {
                  void openPortal();
                }}
              >
                <Settings className="size-4" />
                {t("portalAction")}
              </Button>
            ) : (
              <Button
                asChild
                className="w-full justify-start gap-2 border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-800"
              >
                <Link href={getWorkspacePath(workspaceId, "/profile/contact")}>
                  <LifeBuoy className="size-4" />
                  {t("contactAction")}
                </Link>
              </Button>
            )}
          </div>

          <div className="rounded-card border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 size-4 text-zinc-500" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-900">
                  {t("allowedTitle")}
                </p>
                <p className="text-sm leading-6 text-zinc-600">
                  {t("allowedDescription")}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </ProtectedPageContainer>
    </div>
  );
}
