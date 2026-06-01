"use client";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { useSubscriptionRequiredActions } from "@/app/[locale]/(protected)/[workspaceId]/subscription-required/_hooks/useSubscriptionRequiredActions";
import { useProfileBillingActions } from "@/app/[locale]/(protected)/workspace/billing/_hooks/useProfileBillingActions";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Link } from "@/i18n/routing";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { CreditCard, Settings, Users } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50/50 px-4 py-12">
      <div className="w-full max-w-[480px] space-y-4 animate-dowin-in">

        {/* Main card */}
        <Card className="divide-y divide-zinc-100 border-zinc-200 bg-white">
          {/* Title + description */}
          <div className="px-6 py-6 text-center">
            <h1 className="text-lg font-black tracking-tight text-zinc-900">
              {canManageBilling ? t("adminTitle") : t("memberTitle")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {canManageBilling ? t("adminDescription") : t("memberDescription")}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 px-6 py-5">
            {canStartCheckout ? (
              <Button
                className="w-full justify-center gap-2 rounded-button bg-primary py-3 text-sm font-black text-white transition-all"
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
                    <CreditCard className="size-4" />
                    {t("checkoutAction")}
                  </>
                )}
              </Button>
            ) : (
              <Button
                asChild
                className="w-full justify-center gap-2 rounded-button bg-primary py-3 text-sm font-black text-white transition-all"
              >
                <Link href={getWorkspacePath(workspaceId, "/workspace/billing")}>
                  <CreditCard className="size-4" />
                  {t("billingAction")}
                </Link>
              </Button>
            )}
            {canOpenPortal ? (
              <Button
                className="w-full justify-center gap-2 rounded-button border border-zinc-200 bg-white py-3 text-sm font-black text-zinc-700 transition-all"
                disabled={isPortalPending}
                onClick={() => {
                  void openPortal();
                }}
              >
                {isPortalPending ? (
                  <InlineSpinner size="sm" />
                ) : (
                  <Settings className="size-4" />
                )}
                {t("portalAction")}
              </Button>
            ) : (
              <Button
                asChild
                className="w-full justify-center gap-2 rounded-button border border-zinc-200 bg-white py-3 text-sm font-black text-zinc-700 transition-all"
              >
                <Link href={getWorkspacePath(workspaceId, "/profile/contact")}>
                  {t("contactAction")}
                </Link>
              </Button>
            )}
          </div>

          {/* Allowed access notice */}
          <div className="px-6 py-4">
            <div className="flex items-start gap-3 rounded-content bg-zinc-50 p-4">
              <Users className="mt-0.5 size-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-sm font-bold text-zinc-800">
                  {t("allowedTitle")}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {t("allowedDescription")}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
