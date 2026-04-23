"use client";

import { useGetBillingMe } from "@/api/generated/billing/billing";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { useProfileBillingActions } from "@/app/[locale]/(protected)/profile/billing/_hooks/useProfileBillingActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import {
  ArrowClockwise20Regular,
  ArrowUpRight20Regular,
  Payment20Regular,
  ShieldLock20Regular,
  Wallet20Regular,
} from "@fluentui/react-icons";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type BillingStatus = "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
type PlanCode = "FREE" | "STANDARD";

export default function ProfileBillingPage() {
  const t = useTranslations("ProfileBilling");
  const {
    data: billingResponse,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetBillingMe({
    query: {
      retry: false,
    },
  });
  const {
    handleReturnedFromCheckout,
    isCheckoutPending,
    openPortal,
    startCheckout,
  } = useProfileBillingActions();
  const [isReturningFromCheckout, setIsReturningFromCheckout] = useState(false);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const billing = currentUrl.searchParams.get("billing");

    if (billing !== "success") {
      return;
    }

    setIsReturningFromCheckout(true);
    currentUrl.searchParams.delete("billing");
    window.history.replaceState({}, "", currentUrl.pathname + currentUrl.search);
    void handleReturnedFromCheckout();
  }, [handleReturnedFromCheckout]);

  const hasNoWorkspace = getApiErrorStatus(error) === 404;
  const billing = billingResponse?.status === 200 ? billingResponse.data : null;

  if (isLoading) {
    return <ProfileBillingSkeleton />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (!billing) {
    return <BillingErrorState onRefresh={() => void refetch()} />;
  }

  const isAdmin = billing.canManageBilling;
  const requiresManualReview = billing.requiresManualReview;
  const canUpgrade =
    isAdmin &&
    !requiresManualReview &&
    (billing.billingStatus === "NONE" ||
      billing.billingStatus === "EXPIRED" ||
      billing.billingStatus === "REVOKED");
  const canOpenPortal =
    isAdmin &&
    (billing.planCode === "STANDARD" ||
      billing.billingStatus === "ACTIVE" ||
      billing.billingStatus === "CANCELED");

  return (
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      <ProtectedPageContainer>
        <ProtectedPageHeader title={t("header")} />

        <Card className="flex items-center justify-between gap-4 rounded-content border border-border px-6 py-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-content bg-primary/10 text-primary">
              <Wallet20Regular className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-text-primary">
                {billing.workspaceName}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canUpgrade && (
              <Button
                type="button"
                onClick={startCheckout}
                disabled={isCheckoutPending}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-content px-3 text-[11px] font-bold btn-linear-primary`}
              >
                <Payment20Regular className="h-3.5 w-3.5" />
                {isCheckoutPending ? t("checkoutLoading") : t("upgradeButton")}
              </Button>
            )}

            {canOpenPortal && (
              <Button
                type="button"
                onClick={() => void openPortal()}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-content border border-border bg-white px-3 text-[11px] font-bold text-text-primary transition-colors hover:bg-sub-background`}
              >
                <ArrowUpRight20Regular className="h-3.5 w-3.5" />
                {t("portalButton")}
              </Button>
            )}
          </div>
        </Card>

        {!isAdmin && (
          <div className="rounded-content border border-border bg-sub-background px-3 py-3 text-[11px] leading-relaxed text-text-muted">
            {t("memberNotice")}
          </div>
        )}

        {isReturningFromCheckout ? (
          <Card className="space-y-2 rounded-content border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-bold text-text-primary">
              {t("pendingTitle")}
            </p>
            <p className="text-[11px] leading-relaxed text-text-muted">
              {t("pendingDesc")}
            </p>
            <Button
              type="button"
              onClick={() => void refetch()}
              className="mt-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-content border border-primary/20 bg-white px-3 text-[11px] font-bold text-primary"
            >
              <ArrowClockwise20Regular className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </Card>
        ) : null}

        {requiresManualReview ? (
          <Card className="space-y-3 rounded-content border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-content bg-white text-red-600">
                <ShieldLock20Regular className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-text-primary">
                  {t("riskReviewTitle")}
                </p>
                <p className="text-[11px] leading-relaxed text-text-muted">
                  {t("riskReviewDesc", {
                    refundCount: billing.recentRefundCount,
                    revokedCount: billing.recentRevokedCount,
                  })}
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="space-y-4 rounded-content border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">
              {t("currentPlanTitle")}
            </h2>
            <p className="text-[11px] leading-relaxed text-text-muted">
              {getStatusDescription({
                status: billing.billingStatus,
                planCode: billing.planCode,
                currentPeriodEnd: billing.currentPeriodEnd,
                t,
              })}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <BillingInfoCell
              label={t("planLabel")}
              value={billing.planCode}
              tone={billing.planCode === "STANDARD" ? "primary" : "default"}
            />
            <BillingInfoCell
              label={t("periodEndLabel")}
              value={formatDateLabel(billing.currentPeriodEnd, t("notAvailable"))}
              tone="default"
            />
          </div>
        </Card>

        <Card className="space-y-1 rounded-content border border-border bg-sub-background p-4">
          <h2 className="text-sm font-bold text-text-primary">
            {t("downgradePolicyTitle")}
          </h2>
          <p className="text-[11px] leading-relaxed text-text-muted">
            {t("downgradePolicyDesc")}
          </p>
        </Card>

        <Card className="space-y-3 rounded-content border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">
              {t("standardTitle")}
            </h2>
            <p className="text-[11px] text-text-muted">{t("standardDesc")}</p>
          </div>

          <div className="grid gap-2">
            {[
              t("standardFeature1"),
              t("standardFeature2"),
              t("standardFeature3"),
            ].map((feature) => (
              <div
                key={feature}
                className="rounded-content border border-border bg-white px-3 py-2 text-xs text-text-primary"
              >
                {feature}
              </div>
            ))}
          </div>
        </Card>
      </ProtectedPageContainer>
    </div>
  );
}

function BillingInfoCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "primary" | "danger";
}) {
  return (
    <div className="rounded-content border border-border bg-white px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-bold ${
          tone === "primary"
            ? "text-primary"
            : tone === "danger"
              ? "text-red-700"
              : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatDateLabel(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatusDescription({
  status,
  planCode,
  currentPeriodEnd,
  t,
}: {
  status: BillingStatus;
  planCode: PlanCode;
  currentPeriodEnd: string | null | undefined;
  t: ReturnType<typeof useTranslations<"ProfileBilling">>;
}) {
  const formattedDate = formatDateLabel(currentPeriodEnd, t("notAvailable"));

  switch (status) {
    case "ACTIVE":
      return t("statusDescActive", { date: formattedDate });
    case "CANCELED":
      return t("statusDescCanceled", { date: formattedDate });
    case "EXPIRED":
      return t("statusDescExpired");
    case "REVOKED":
      return t("statusDescRevoked");
    case "NONE":
    default:
      return planCode === "STANDARD"
        ? t("statusDescStandardFallback")
        : t("statusDescFree");
  }
}

function ProfileBillingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      <ProtectedPageContainer isLoading>
        <div className="h-10 rounded-content bg-sub-background" />
        <div className="h-24 rounded-content bg-sub-background" />
        <div className="h-48 rounded-content bg-sub-background" />
        <div className="h-36 rounded-content bg-sub-background" />
      </ProtectedPageContainer>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("ProfileBilling");

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-4 rounded-content border border-border p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-content bg-primary/10 text-primary">
            <Wallet20Regular className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-text-primary">
              {t("noWorkspaceTitle")}
            </h1>
            <p className="text-sm text-text-muted">{t("noWorkspaceDesc")}</p>
          </div>
          <div className="flex justify-center">
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
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-4 rounded-content border border-border p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-content bg-primary/10 text-primary">
            <ShieldLock20Regular className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-text-primary">
              {t("loadFailedTitle")}
            </h1>
            <p className="text-sm text-text-muted">{t("loadFailedDesc")}</p>
          </div>
          <Button
            type="button"
            onClick={onRefresh}
            className="w-full rounded-content border border-border bg-white py-3 text-sm font-semibold text-text-primary"
          >
            {t("refresh")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
