"use client";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { useProfileBillingActions } from "@/app/[locale]/(protected)/workspace/billing/_hooks/useProfileBillingActions";
import { useUpdateWorkspaceSeatsMutation } from "@/app/[locale]/(protected)/workspace/billing/_hooks/useUpdateWorkspaceSeatsMutation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Logo } from "@/components/ui/Logo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useNativeApp } from "@/context/NativeAppContext";
import { useToast } from "@/context/ToastContext";
import { Link } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { Activity } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type EntitlementSource =
  | "POLAR"
  | "MANUAL_GRANT"
  | "PARTNER"
  | "INTERNAL_TEST"
  | "BETA_PROMOTIONAL_GRANT"
  | null;

function getPeriodEndLabelKey(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "nextRenewalLabel" as const;
    case "CANCELED":
      return "scheduledEndLabel" as const;
    case "EXPIRED":
    case "REVOKED":
      return "periodEndedLabel" as const;
    default:
      return "currentPeriodEndLabel" as const;
  }
}

export function ProfileBillingPageClient() {
  const t = useTranslations("ProfileBilling");
  const isNativeApp = useNativeApp();
  const { showToast } = useToast();
  const locale = useLocale();
  const workspaceId = useParams().workspaceId as string | undefined;
  const {
    data: billingResponse,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetWorkspacesWorkspaceIdBillingMe(workspaceId ?? "", {
    query: {
      retry: false,
    },
  });
  const { handleReturnedFromCheckout, openPortal, isPortalPending } =
    useProfileBillingActions(workspaceId);
  const [isReturningFromCheckout, setIsReturningFromCheckout] = useState(false);
  const { updateSeats, isUpdatingSeats } = useUpdateWorkspaceSeatsMutation(
    workspaceId ?? "",
  );

  const handleSeatChangeClick = () => {
    if (!billingResponse || billingResponse.status !== 200) return;
    const currentBilling = billingResponse.data;
    const currentUsedSeats = currentBilling.usedSeatCount ?? 1;
    const initialSeats = currentBilling.purchasedSeatCount ?? currentUsedSeats;

    const input = window.prompt(
      t("seatChangeDialogDesc", {
        currentLimit: initialSeats,
        currentUsed: currentUsedSeats,
      }),
      initialSeats.toString(),
    );
    if (input === null) return;

    const count = parseInt(input.trim(), 10);
    if (isNaN(count)) {
      alert(t("seatChangeMinError"));
      return;
    }

    if (count < currentUsedSeats) {
      alert(
        t("seatChangeErrorLowerThanCurrent", {
          current: currentUsedSeats,
          requested: count,
          removeCount: currentUsedSeats - count,
        }),
      );
      return;
    }

    if (count > 999) {
      alert(t("seatChangeMaxError"));
      return;
    }

    updateSeats({ workspaceId: workspaceId ?? "", data: { seatCount: count } });
  };

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const billing = currentUrl.searchParams.get("billing");

    if (billing === "portal_error") {
      showToast("error", t("portalFailed"));
      currentUrl.searchParams.delete("billing");
      currentUrl.searchParams.delete("code");
      window.history.replaceState(
        {},
        "",
        currentUrl.pathname + currentUrl.search,
      );
      return;
    }

    if (billing !== "success") {
      return;
    }

    setIsReturningFromCheckout(true);
    currentUrl.searchParams.delete("billing");
    window.history.replaceState(
      {},
      "",
      currentUrl.pathname + currentUrl.search,
    );
    void handleReturnedFromCheckout();
  }, [handleReturnedFromCheckout, showToast, t]);

  const hasNoWorkspace = getApiErrorStatus(error) === 404;
  const billing = billingResponse?.status === 200 ? billingResponse.data : null;

  if (isLoading) {
    return <ProfileBillingSkeleton />;
  }

  if (isNativeApp) {
    return <BillingUnavailableInAppState />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (!billing) {
    return <BillingErrorState onRefresh={() => void refetch()} />;
  }

  const isAdmin = billing.canManageBilling;
  const requiresManualReview = billing.requiresManualReview;
  const isPolarEntitlement = billing.entitlementSource === "POLAR";
  const canOpenPortal =
    isAdmin &&
    isPolarEntitlement &&
    (billing.billingStatus === "ACTIVE" ||
      billing.billingStatus === "CANCELED");

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <ProtectedPageContainer className="space-y-8 lg:space-y-12">
        <ProtectedPageHeader title={t("header")} />

        <div className="space-y-4">
          <Card className="flex items-center justify-between gap-4 border-zinc-200 bg-white p-5 md:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-content bg-zinc-50 text-primary">
                <DowinIcon name="domain-wallet" size="24px" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight text-zinc-900">
                  {billing.workspaceName}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {canOpenPortal ? (
                <Button
                  type="button"
                  onClick={() => void openPortal()}
                  disabled={isPortalPending}
                  className="h-10 rounded-button border border-zinc-200 bg-white px-5 text-sm font-black text-zinc-600 transition-colors"
                >
                  {isPortalPending ? t("portalLoading") : t("portalButton")}
                </Button>
              ) : null}
            </div>
          </Card>

          {!isAdmin ? (
            <div className="flex items-start gap-2.5 rounded-content border border-zinc-200 bg-zinc-100/50 px-4 py-3 text-[12px] font-medium leading-relaxed text-zinc-500">
              <DowinIcon
                name="status-locked"
                size="14px"
                className="mt-0.5 shrink-0"
              />
              {t("memberNotice")}
            </div>
          ) : null}

          {billing.entitlementSource === "BETA_PROMOTIONAL_GRANT" ? (
            <div className="flex items-start gap-2.5 rounded-content border border-primary/20 bg-primary/5 px-4 py-3 text-[12px] font-bold leading-relaxed text-primary">
              <DowinIcon
                name="status-info"
                size="14px"
                className="mt-0.5 shrink-0"
              />
              Basic 프로모션 코드가 적용되어 있어요. 결제 없이 Basic 기능을 계속
              사용할 수 있으며, 최대 {billing.purchasedSeatCount ?? 1}명까지
              함께 사용할 수 있습니다.
            </div>
          ) : billing.entitlementSource && !isPolarEntitlement ? (
            <div className="flex items-start gap-2.5 rounded-content border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-medium leading-relaxed text-amber-800">
              <DowinIcon
                name="status-info"
                size="14px"
                className="mt-0.5 shrink-0"
              />
              {t("nonPolarEntitlementNotice", {
                source: getEntitlementSourceLabel(billing.entitlementSource, t),
              })}
            </div>
          ) : null}
        </div>

        <section className="space-y-4">
          <SectionHeader title={t("currentPlanTitle")} />
          <Card className="divide-y divide-zinc-100 border-zinc-200 bg-white">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400">
                  <DowinIcon name="domain-target-arrow" size="16px" />
                </div>
                <span className="text-sm font-bold text-zinc-500">
                  {t("planLabel")}
                </span>
              </div>
              <span className="text-sm font-black text-primary">
                {t("basicPlanName")}
              </span>
            </div>
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400">
                  <Activity size={16} />
                </div>
                <span className="text-sm font-bold text-zinc-500">
                  {t("statusLabel")}
                </span>
              </div>
              <span
                className={`text-sm font-black ${
                  billing.billingStatus === "ACTIVE" ||
                  billing.billingStatus === "CANCELED"
                    ? "text-success"
                    : "text-zinc-400"
                }`}
              >
                {billing.billingStatus === "ACTIVE" ||
                billing.billingStatus === "CANCELED"
                  ? t("statusActiveLabel")
                  : t("statusInactiveLabel")}
              </span>
            </div>
            {(billing.purchasedSeatCount !== null ||
              billing.usedSeatCount !== null) &&
              (billing.billingStatus === "ACTIVE" ||
                billing.billingStatus === "CANCELED") && (
                <>
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400">
                        <DowinIcon name="domain-people" size="16px" />
                      </div>
                      <span className="text-sm font-bold text-zinc-500">
                        {t("usedSeatLabel")}
                      </span>
                    </div>
                    <span className="text-sm font-black text-zinc-900">
                      {billing.usedSeatCount ?? 0} {t("seatUnit")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400">
                        <DowinIcon name="domain-people" size="16px" />
                      </div>
                      <span className="text-sm font-bold text-zinc-500">
                        {t("purchasedSeatLabel")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-zinc-900">
                        {billing.purchasedSeatCount} {t("seatUnit")}
                      </span>
                      {isAdmin && isPolarEntitlement && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            onClick={handleSeatChangeClick}
                            disabled={isUpdatingSeats}
                            className="h-8 rounded-button border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-600 transition-colors"
                          >
                            {isUpdatingSeats
                              ? t("seatChangeDialogSubmitting")
                              : t("seatChangeButton")}
                          </Button>
                          <InfoTooltip
                            align="right"
                            side="top"
                            content={t("seatChangePolicyTooltip")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400">
                  <DowinIcon name="domain-calendar" size="16px" />
                </div>
                <span className="text-sm font-bold text-zinc-500">
                  {t(getPeriodEndLabelKey(billing.billingStatus))}
                </span>
              </div>
              <span className="text-sm font-black text-zinc-900">
                {formatDateLabel(
                  billing.currentPeriodEnd,
                  t("notAvailable"),
                  locale,
                )}
              </span>
            </div>
          </Card>
        </section>

        {isReturningFromCheckout || requiresManualReview ? (
          <div className="space-y-4">
            {isReturningFromCheckout ? (
              <Card className="space-y-3 border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <DowinIcon name="status-info" size="18px" />
                  <p className="text-[14px] font-black">{t("pendingTitle")}</p>
                </div>
                <p className="text-[12px] leading-relaxed text-zinc-600">
                  {t("pendingDesc")}
                </p>
                <Button
                  type="button"
                  onClick={() => void refetch()}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-button border border-primary/20 bg-white px-4 text-[12px] font-bold text-primary transition-all"
                >
                  <DowinIcon
                    name="action-refresh"
                    size="14px"
                    className={isFetching ? "animate-spin" : ""}
                  />
                  {t("refresh")}
                </Button>
              </Card>
            ) : null}

            {requiresManualReview ? (
              <Card className="space-y-3 border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-2 text-red-600">
                  <DowinIcon name="status-locked" size="18px" />
                  <p className="text-[14px] font-black">
                    {t("riskReviewTitle")}
                  </p>
                </div>
                <p className="text-[12px] leading-relaxed text-red-700/80">
                  {t("riskReviewDesc", {
                    refundCount: billing.recentRefundCount,
                    revokedCount: billing.recentRevokedCount,
                  })}
                </p>
              </Card>
            ) : null}
          </div>
        ) : null}

        <section>
          <Card className="border-zinc-200 bg-zinc-100/50 p-5">
            <h3 className="flex items-center gap-2 text-[14px] font-black text-zinc-900">
              <DowinIcon
                name="status-info"
                size="16px"
                className="text-zinc-400"
              />
              {t("downgradePolicyTitle")}
            </h3>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-zinc-500">
              {t("downgradePolicyDesc")}
            </p>
          </Card>
        </section>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-1 text-[12px] font-bold text-zinc-400">
          <Link href="/billing-policy" className="transition-colors">
            {t("billingPolicyLink")}
          </Link>
          <Link href="/terms" className="transition-colors">
            {t("termsLink")}
          </Link>
          <Link href="/privacy" className="transition-colors">
            {t("privacyLink")}
          </Link>
          <Link
            href={getWorkspacePath(workspaceId, "/profile/contact")}
            className="transition-colors"
          >
            {t("contactLink")}
          </Link>
        </div>
      </ProtectedPageContainer>
    </div>
  );
}

function BillingUnavailableInAppState() {
  const t = useTranslations("ProfileBilling");
  const workspaceId = useParams().workspaceId as string | undefined;

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <EmptyStatePanel
          title={t("appUnavailableTitle")}
          description={t("appUnavailableDesc")}
          actions={
            <Button
              asChild
              className="rounded-button border border-zinc-200 bg-white px-5 py-3 text-sm font-black text-zinc-900 transition-colors"
            >
              <Link href={getWorkspacePath(workspaceId, "/profile")}>
                {t("appUnavailableAction")}
              </Link>
            </Button>
          }
          icon={
            <DowinIcon
              name="domain-wallet"
              size="24px"
              className="text-primary"
            />
          }
        />
      </div>
    </div>
  );
}

function formatDateLabel(
  value: string | null | undefined,
  fallback: string,
  locale = "ko",
) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getEntitlementSourceLabel(
  source: EntitlementSource,
  t: ReturnType<typeof useTranslations<"ProfileBilling">>,
) {
  switch (source) {
    case "POLAR":
      return t("entitlementSourcePolar");
    case "MANUAL_GRANT":
      return t("entitlementSourceManualGrant");
    case "PARTNER":
      return t("entitlementSourcePartner");
    case "INTERNAL_TEST":
      return t("entitlementSourceInternalTest");
    case "BETA_PROMOTIONAL_GRANT":
      return "마케팅 프로모션 혜택 (Beta Promotional Grant)";
    default:
      return t("notAvailable");
  }
}

function ProfileBillingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50/50">
      <ProtectedPageContainer isLoading>
        <div className="h-10 w-48 rounded-content bg-zinc-100" />
        <div className="h-32 rounded-content bg-zinc-100" />
        <div className="space-y-4">
          <div className="h-6 w-32 rounded-content bg-zinc-100" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 rounded-content bg-zinc-100" />
            <div className="h-24 rounded-content bg-zinc-100" />
          </div>
        </div>
        <div className="h-48 rounded-content bg-zinc-100" />
      </ProtectedPageContainer>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("ProfileBilling");

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-6 rounded-content border-zinc-200 bg-white p-8 text-center shadow-xl shadow-zinc-200/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Logo size="32px" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black tracking-tight text-zinc-900">
              {t("noWorkspaceTitle")}
            </h1>
            <p className="text-sm font-medium leading-relaxed text-zinc-500">
              {t("noWorkspaceDesc")}
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <NoWorkspaceActions />
          </div>
        </Card>
      </div>
    </div>
  );
}

function BillingErrorState({ onRefresh }: { onRefresh: () => void }) {
  const t = useTranslations("ProfileBilling");

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-6 rounded-content border-zinc-200 bg-white p-8 text-center shadow-xl shadow-zinc-200/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <DowinIcon name="status-locked" size="32px" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black tracking-tight text-zinc-900">
              {t("loadFailedTitle")}
            </h1>
            <p className="text-sm font-medium leading-relaxed text-zinc-500">
              {t("loadFailedDesc")}
            </p>
          </div>
          <Button
            type="button"
            onClick={onRefresh}
            className="btn-dowin-primary h-12 w-full text-[15px] font-black"
          >
            {t("refresh")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
