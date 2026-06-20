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
import { DowinIcon } from "@/components/ui/DowinIcon";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Logo } from "@/components/ui/Logo";
import { useNativeApp } from "@/context/NativeAppContext";
import { useToast } from "@/context/ToastContext";
import { Link } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
// import { Activity } from "lucide-react";
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
    <div className="min-h-screen">
      <ProtectedPageContainer className="max-w-[640px] space-y-6 pb-24 md:pb-10 lg:pb-12">
        <ProtectedPageHeader title={t("header")} />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-[24px] bg-surface p-5 md:p-6">
            <div className="flex min-w-0 items-center">
              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight text-text-primary">
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
                  className="h-10 rounded-[12px] bg-sub-background px-5 text-sm font-bold text-text-secondary hover:bg-border transition-colors"
                >
                  {isPortalPending ? t("portalLoading") : t("portalButton")}
                </Button>
              ) : null}
            </div>
          </div>

          {!isAdmin ? (
            <div className="flex items-start gap-2.5 rounded-[16px] border-none bg-surface px-4 py-3 text-[12px] font-medium leading-relaxed text-text-muted">
              <DowinIcon
                name="status-locked"
                size="14px"
                className="mt-0.5 shrink-0"
              />
              {t("memberNotice")}
            </div>
          ) : null}

          {billing.entitlementSource === "BETA_PROMOTIONAL_GRANT" ? (
            <div className="flex items-start gap-2.5 rounded-[16px] border-none bg-primary/5 px-4 py-3 text-[12px] font-bold leading-relaxed text-primary">
              <DowinIcon
                name="status-info"
                size="14px"
                className="mt-0.5 shrink-0"
              />
              {billing.promotionalDurationDays !== undefined && billing.promotionalDurationDays !== null
                ? t("betaPromotionalGrantNoticeDynamic", {
                    duration: billing.promotionalDurationDays === 7 ? t("promoDurationWeeks", { count: 1 }) :
                              billing.promotionalDurationDays === 14 ? t("promoDurationWeeks", { count: 2 }) :
                              billing.promotionalDurationDays === 30 ? t("promoDurationMonths", { count: 1 }) :
                              billing.promotionalDurationDays === 60 ? t("promoDurationMonths", { count: 2 }) :
                              billing.promotionalDurationDays === 365 ? t("promoDurationYears", { count: 1 }) :
                              t("promoDurationDays", { count: billing.promotionalDurationDays })
                  })
                : t("betaPromotionalGrantNotice")}
            </div>
          ) : billing.entitlementSource && !isPolarEntitlement ? (
            <div className="flex items-start gap-2.5 rounded-[16px] border-none bg-amber-500/10 px-4 py-3 text-[12px] font-medium leading-relaxed text-amber-500">
              <DowinIcon
                name="status-info"
                size="14px"
                className="mt-0.5 shrink-0"
              />
              <span>
                {t.rich("nonPolarEntitlementNotice", {
                  source: getEntitlementSourceLabel(
                    billing.entitlementSource,
                    t,
                  ),
                  contact: (chunks) => (
                    <Link
                      href={getWorkspacePath(workspaceId, "/profile/contact")}
                      className="underline underline-offset-2 hover:text-amber-900"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </div>
          ) : null}
        </div>

        <section className="space-y-4">
          <h2 className="px-1 text-lg font-bold tracking-tight text-text-primary">
            {t("currentPlanTitle")}
          </h2>
          <div className="rounded-[24px] bg-surface py-2">
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-[15px] font-medium text-text-secondary">
                {t("planLabel")}
              </span>
              <span className="text-[15px] font-bold text-primary">
                {t("basicPlanName")}
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-[15px] font-medium text-text-secondary">
                {t("statusLabel")}
              </span>
              <span
                className={`text-[15px] font-bold ${
                  billing.billingStatus === "ACTIVE" ||
                  billing.billingStatus === "CANCELED"
                    ? "text-success"
                    : "text-text-muted"
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
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-[15px] font-medium text-text-secondary">
                      {t("usedSeatLabel")}
                    </span>
                    <span className="text-[15px] font-bold text-text-primary">
                      {billing.usedSeatCount ?? 0} {t("seatUnit")}
                    </span>
                  </div>
                  <div className="flex flex-col px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[15px] font-medium text-text-secondary">
                          {t("purchasedSeatLabel")}
                        </span>
                        {isAdmin && isPolarEntitlement && (
                          <InfoTooltip
                            content={t("seatChangePolicyTooltip")}
                            align="left"
                            side="top"
                          />
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <span className="whitespace-nowrap text-[15px] font-bold text-text-primary">
                          {billing.purchasedSeatCount} {t("seatUnit")}
                        </span>
                        {isAdmin && isPolarEntitlement && (
                          <Button
                            type="button"
                            onClick={handleSeatChangeClick}
                            disabled={isUpdatingSeats}
                            className="whitespace-nowrap h-8 rounded-[12px] bg-sub-background px-3 text-xs font-bold text-text-secondary hover:bg-border transition-colors"
                          >
                            {isUpdatingSeats
                              ? t("seatChangeDialogSubmitting")
                              : t("seatChangeButton")}
                          </Button>
                        )}
                      </div>
                    </div>
                    {billing.pendingSeatCount !== null && (
                      <div className="mt-1">
                        <span className="text-[13px] font-semibold leading-tight text-primary">
                          {t("pendingSeatLabel")} (
                          {billing.pendingSeatEffectiveAt
                            ? t("pendingSeatValue", {
                                count: billing.pendingSeatCount,
                                date: formatDateLabel(
                                  billing.pendingSeatEffectiveAt,
                                  t("notAvailable"),
                                  locale,
                                ),
                              })
                            : t("pendingSeatValueNoDate", {
                                count: billing.pendingSeatCount,
                              })}
                          )
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            <div className="flex flex-col px-6 py-4 gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-medium text-text-secondary">
                  {billing.entitlementSource === "BETA_PROMOTIONAL_GRANT"
                    ? t("promotionProvidedPeriod")
                    : t(getPeriodEndLabelKey(billing.billingStatus))}
                </span>
                <span className="text-[15px] font-bold text-text-primary text-right">
                  {billing.entitlementSource === "BETA_PROMOTIONAL_GRANT"
                    ? (
                        billing.currentPeriodEnd 
                          ? `${billing.promotionalDurationDays !== undefined && billing.promotionalDurationDays !== null ? `${formatDateLabel(
                              new Date(new Date(billing.currentPeriodEnd).getTime() - billing.promotionalDurationDays * 24 * 60 * 60 * 1000).toISOString(),
                              t("notAvailable"),
                              locale
                            )} ~ ` : ""}${formatDateLabel(
                              billing.currentPeriodEnd,
                              t("notAvailable"),
                              locale
                            )}`
                          : t("promoDurationLifetime")
                      )
                    : (
                        <span className="flex items-center justify-end gap-1.5">
                          {formatDateLabel(
                            billing.currentPeriodEnd,
                            t("notAvailable"),
                            locale,
                          )}
                        </span>
                      )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {isReturningFromCheckout || requiresManualReview ? (
          <div className="space-y-4">
            {isReturningFromCheckout ? (
              <div className="space-y-3 rounded-[24px] bg-primary/5 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <DowinIcon name="status-info" size="18px" />
                  <p className="text-[14px] font-black">{t("pendingTitle")}</p>
                </div>
                <p className="text-[12px] leading-relaxed text-text-secondary">
                  {t("pendingDesc")}
                </p>
                <Button
                  type="button"
                  onClick={() => void refetch()}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-[12px] font-bold text-white transition-all"
                >
                  <DowinIcon
                    name="action-refresh"
                    size="14px"
                    className={isFetching ? "animate-spin" : ""}
                  />
                  {t("refresh")}
                </Button>
              </div>
            ) : null}

            {requiresManualReview ? (
              <div className="space-y-3 rounded-[24px] bg-danger/10 p-5">
                <div className="flex items-center gap-2 text-danger">
                  <DowinIcon name="status-locked" size="18px" />
                  <p className="text-[14px] font-black">
                    {t("riskReviewTitle")}
                  </p>
                </div>
                <p className="text-[12px] leading-relaxed text-danger/80">
                  {t("riskReviewDesc", {
                    refundCount: billing.recentRefundCount,
                    revokedCount: billing.recentRevokedCount,
                  })}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <section>
          <div className="rounded-[24px] bg-surface p-5">
            <h3 className="flex items-center gap-2 text-[14px] font-black text-text-primary">

              {t("downgradePolicyTitle")}
            </h3>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-text-muted">
              {t("downgradePolicyDesc")}
            </p>
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-1 text-[12px] font-bold text-text-muted">
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
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <EmptyStatePanel
          title={t("appUnavailableTitle")}
          description={t("appUnavailableDesc")}
          actions={
            <Button
              asChild
              className="rounded-[12px] bg-sub-background px-5 py-3 text-sm font-bold text-text-primary hover:bg-border transition-colors"
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
      return t("entitlementSourceBetaPromotionalGrant");
    default:
      return t("notAvailable");
  }
}

function ProfileBillingSkeleton() {
  return (
    <div className="min-h-screen">
      <ProtectedPageContainer
        isLoading
        className="max-w-[640px] space-y-6 pb-24 md:pb-10 lg:pb-12"
      >
        <div className="h-10 w-48 rounded-[24px] bg-border" />
        <div className="h-32 rounded-[24px] bg-border" />
        <div className="space-y-3">
          <div className="h-6 w-32 rounded-[16px] bg-border" />
          <div className="space-y-2">
            <div className="h-24 rounded-[16px] bg-border" />
            <div className="h-24 rounded-[16px] bg-border" />
          </div>
        </div>
        <div className="h-48 rounded-[24px] bg-border" />
      </ProtectedPageContainer>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("ProfileBilling");

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <div className="w-full space-y-6 rounded-[24px] bg-surface p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Logo size="32px" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black tracking-tight text-text-primary">
              {t("noWorkspaceTitle")}
            </h1>
            <p className="text-sm font-medium leading-relaxed text-text-muted">
              {t("noWorkspaceDesc")}
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <NoWorkspaceActions />
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingErrorState({ onRefresh }: { onRefresh: () => void }) {
  const t = useTranslations("ProfileBilling");

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <div className="w-full space-y-6 rounded-[24px] bg-surface p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <DowinIcon name="status-locked" size="32px" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black tracking-tight text-text-primary">
              {t("loadFailedTitle")}
            </h1>
            <p className="text-sm font-medium leading-relaxed text-text-muted">
              {t("loadFailedDesc")}
            </p>
          </div>
          <Button
            type="button"
            onClick={onRefresh}
            className="rounded-[12px] bg-primary text-white h-12 w-full text-[15px] font-bold hover:bg-primary/90 transition-colors"
          >
            {t("refresh")}
          </Button>
        </div>
      </div>
    </div>
  );
}
