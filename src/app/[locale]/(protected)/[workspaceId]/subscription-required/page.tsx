"use client";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { useSubscriptionRequiredActions } from "@/app/[locale]/(protected)/[workspaceId]/subscription-required/_hooks/useSubscriptionRequiredActions";
import { useProfileBillingActions } from "@/app/[locale]/(protected)/settings/billing/_hooks/useProfileBillingActions";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { Link, useRouter } from "@/i18n/routing";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { hasWorkspaceOperationalAccess } from "@/lib/client/workspace-operational-access";
import { CreditCard, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function SubscriptionRequiredPage() {
  const router = useRouter();
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

  useEffect(() => {
    if (billing && hasWorkspaceOperationalAccess(billing)) {
      router.replace(`/${workspaceId}/dashboard/my`);
    }
  }, [billing, router, workspaceId]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-10 lg:p-12">
      <div className="flex justify-center w-full">
        <Card className="max-w-[480px] w-full space-y-10 animate-dowin-in text-left" radius="xl" padding="xl" variant="subtle">
          
          <div className="space-y-5">
            <Logo size="32px" className="text-text-primary" />
            <div className="space-y-2">
              <h1 className="text-[24px] font-black tracking-tight text-text-primary leading-none">
                {canManageBilling ? t("adminTitle") : t("memberTitle")}
              </h1>
              <div className="text-[15px] font-medium text-text-muted tracking-tight break-keep pt-1">
                {canManageBilling ? t("adminDescription") : t("memberDescription")}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {canStartCheckout ? (
              <Button
                variant="hero"
                size="hero"
                className="w-full"
                disabled={isCheckoutPending}
                onClick={() => {
                  void startBasicCheckout();
                }}
              >
                {isCheckoutPending ? (
                  <>
                    <InlineSpinner size="sm" className="border-white/30 border-t-white" />
                    {t("checkoutLoading")}
                  </>
                ) : (
                  <>
                    <CreditCard className="size-5" />
                    {t("checkoutAction")}
                  </>
                )}
              </Button>
            ) : canManageBilling ? (
              <Button
                asChild
                variant="hero"
                size="hero"
                className="w-full"
              >
                <Link href={getWorkspacePath(workspaceId, "/workspace/billing")}>
                  <CreditCard className="size-5" />
                  {t("billingAction")}
                </Link>
              </Button>
            ) : null}
            {canOpenPortal ? (
              <Button
                className="h-[56px] w-full justify-center gap-3 rounded-[24px] border border-border bg-surface px-8 text-[16px] font-black text-text-secondary transition-all"
                disabled={isPortalPending}
                onClick={() => {
                  void openPortal();
                }}
              >
                {isPortalPending ? (
                  <InlineSpinner size="sm" />
                ) : (
                  <Settings className="size-5" />
                )}
                {t("portalAction")}
              </Button>
            ) : (
              <Button
                asChild
                className="h-[56px] w-full justify-center gap-3 rounded-[24px] border border-border bg-surface px-8 text-[16px] font-black text-text-secondary transition-all"
              >
                <Link href={getWorkspacePath(workspaceId, "/profile/contact")}>
                  {t("contactAction")}
                </Link>
              </Button>
            )}
          </div>


        </Card>
      </div>
    </div>
  );
}
