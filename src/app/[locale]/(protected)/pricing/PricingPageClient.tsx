"use client";

import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { useProfileBillingActions } from "@/app/[locale]/(protected)/profile/billing/_hooks/useProfileBillingActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useNativeApp } from "@/context/NativeAppContext";
import { Link } from "@/i18n/routing";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

type EntitlementSource =
  | "POLAR"
  | "MANUAL_GRANT"
  | "PARTNER"
  | "INTERNAL_TEST"
  | null;

export function PricingPageClient() {
  const t = useTranslations("Pricing");
  const params = useParams();
  const isNativeApp = useNativeApp();
  const { data: workspaceResponse } = useGetWorkspacesMe();
  const workspaceId = (params.workspaceId as string | undefined) ?? (workspaceResponse?.status === 200 ? (workspaceResponse?.data?.id ?? "") : "");
  const { data: billingResponse, error, isLoading } = useGetWorkspacesWorkspaceIdBillingMe(workspaceId, {
    query: {
      retry: false,
      enabled: !!workspaceId,
    },
  });
  const { isCheckoutPending, startCheckout } = useProfileBillingActions();

  const hasNoWorkspace = getApiErrorStatus(error) === 404;
  const billing = billingResponse?.status === 200 ? billingResponse.data : null;

  if (isLoading) {
    return <PricingSkeleton />;
  }

  if (isNativeApp) {
    return <PricingUnavailableInAppState />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (!billing) {
    return <PricingErrorState />;
  }

  const isAdmin = billing.canManageBilling;
  const isPolarEntitlement = billing.entitlementSource === "POLAR";
  const isStandard =
    billing.planCode === "STANDARD" ||
    billing.billingStatus === "ACTIVE" ||
    billing.billingStatus === "CANCELED";
  const canCheckout =
    isAdmin &&
    !isStandard &&
    !billing.requiresManualReview &&
    (billing.billingStatus === "NONE" ||
      billing.billingStatus === "EXPIRED" ||
      billing.billingStatus === "REVOKED");

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <ProtectedPageContainer className="space-y-8 lg:space-y-12">
        <ProtectedPageHeader
          title={t("header")}
          description={t("description")}
        />

        <Card className="space-y-4 border-zinc-200 bg-white p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400">
                {billing.workspaceName}
              </p>
              <h2 className="text-xl font-black tracking-tight text-zinc-900">
                {t("heroTitle")}
              </h2>
              <p className="text-sm font-medium leading-relaxed text-zinc-500">
                {t("heroDesc")}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-content bg-zinc-50 text-primary">
              <DowinIcon name="domain-wallet" size="24px" />
            </div>
          </div>

          {!isAdmin ? (
            <div className="rounded-content border border-zinc-200 bg-zinc-50 px-4 py-3 text-[12px] font-medium leading-relaxed text-zinc-500">
              {t("memberNotice")}
            </div>
          ) : null}

          {billing.requiresManualReview ? (
            <div className="rounded-content border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium leading-relaxed text-red-700/80">
              {t("reviewRequiredNotice")}
            </div>
          ) : null}

          {isStandard && !isPolarEntitlement ? (
            <div className="rounded-content border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-medium leading-relaxed text-amber-800">
              {t("nonPolarEntitlementNotice", {
                source: getPricingEntitlementSourceLabel(
                  billing.entitlementSource,
                  t,
                ),
              })}
            </div>
          ) : null}
        </Card>

        <section className="space-y-4">
          <SectionHeader title={t("plansTitle")} description={t("plansDesc")} />

          <div className="grid gap-4 xl:grid-cols-2">
            <PlanCard
              badge={t("freeBadge")}
              title={t("freeTitle")}
              subtitle={t("freeSubtitle")}
              price={t("freePrice")}
              priceSuffix={t("freePriceSuffix")}
              features={[
                t("freeFeature1"),
                t("freeFeature2"),
                t("freeFeature3"),
                t("freeFeature4"),
              ]}
              footer={isStandard ? t("freeCurrentBlocked") : t("freeCurrentLabel")}
              tone="default"
              cta={
                <Button
                  type="button"
                  disabled
                  className="h-11 w-full border border-zinc-200 bg-zinc-100 text-sm font-black text-zinc-500"
                >
                  {isStandard ? t("freeCurrentBlocked") : t("freeCurrentLabel")}
                </Button>
              }
            />

            <PlanCard
              badge={t("standardBadge")}
              title={t("standardTitle")}
              subtitle={t("standardSubtitle")}
              price={t("standardPrice")}
              priceSuffix={t("standardPriceSuffix")}
              features={[
                t("standardFeature1"),
                t("standardFeature2"),
                t("standardFeature3"),
                t("standardFeature4"),
              ]}
              footer={t("standardFooter")}
              tone="primary"
              cta={
                isStandard ? (
                  <Button
                    asChild
                    className="h-11 w-full border border-primary/15 bg-primary/10 text-sm font-black text-primary"
                  >
                    <Link href={getWorkspacePath(workspaceId, "/profile/billing")}>
                      {isPolarEntitlement
                        ? t("manageButton")
                        : t("viewGrantButton")}
                    </Link>
                  </Button>
                ) : canCheckout ? (
                  <Button
                    type="button"
                    onClick={startCheckout}
                    disabled={isCheckoutPending}
                    className={`h-11 w-full text-sm font-black ${
                      isCheckoutPending
                        ? "cursor-not-allowed bg-zinc-300 text-white"
                        : "btn-dowin-primary"
                    }`}
                  >
                    {isCheckoutPending
                      ? t("checkoutLoading")
                      : t("checkoutButton")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled
                    className="h-11 w-full border border-zinc-200 bg-zinc-100 text-sm font-black text-zinc-500"
                  >
                    {isAdmin
                      ? t("reviewRequiredCta")
                      : t("memberUpgradeBlocked")}
                  </Button>
                )
              }
            />
          </div>
        </section>

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
          <Link
            href="/billing-policy"
            className="transition-colors"
          >
            {t("billingPolicyLink")}
          </Link>
          <Link href="/terms" className="transition-colors">
            {t("termsLink")}
          </Link>
          <Link
            href="/privacy"
            className="transition-colors"
          >
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

function getPricingEntitlementSourceLabel(
  source: EntitlementSource,
  t: ReturnType<typeof useTranslations<"Pricing">>,
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
    default:
      return t("freeTitle");
  }
}

function PlanCard({
  badge,
  title,
  subtitle,
  price,
  priceSuffix,
  features,
  footer,
  cta,
  tone,
}: {
  badge: string;
  title: string;
  subtitle: string;
  price: string;
  priceSuffix: string;
  features: string[];
  footer: string;
  cta: React.ReactNode;
  tone: "default" | "primary";
}) {
  return (
    <Card
      className={`rounded-content border p-5 md:p-6 ${
        tone === "primary"
          ? "border-primary/20 bg-primary/5"
          : "border-zinc-200 bg-white"
      }`}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Badge
            className={`inline-flex rounded-button border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
              tone === "primary"
                ? "border-primary/20 bg-white text-primary"
                : "border-zinc-200 bg-zinc-50 text-zinc-500"
            }`}
          >
            {badge}
          </Badge>
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight text-zinc-900">
              {title}
            </h3>
            <p className="text-sm font-medium leading-relaxed text-zinc-500">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <span
            className={`text-3xl font-black tracking-tight ${
              tone === "primary" ? "text-primary" : "text-zinc-900"
            }`}
          >
            {price}
          </span>
          <span className="pb-1 text-sm font-bold text-zinc-400">
            {priceSuffix}
          </span>
        </div>

        <div className="space-y-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-2.5">
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  tone === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <DowinIcon name="action-checkmark" size="12px" />
              </div>
              <p className="text-[13px] font-bold leading-6 text-zinc-800">
                {feature}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[12px] font-medium leading-relaxed text-zinc-500">
          {footer}
        </p>

        {cta}
      </div>
    </Card>
  );
}

function PricingUnavailableInAppState() {
  const t = useTranslations("Pricing");
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
              <Link href={getWorkspacePath(workspaceId, "/profile")}>{t("appUnavailableAction")}</Link>
            </Button>
          }
          icon={
            <DowinIcon name="domain-wallet" size="24px" className="text-primary" />
          }
        />
      </div>
    </div>
  );
}

function NoWorkspaceState() {
  const t = useTranslations("Pricing");

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

function PricingErrorState() {
  const t = useTranslations("Pricing");

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-6 rounded-content border-zinc-200 bg-white p-8 text-center shadow-xl shadow-zinc-200/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <DowinIcon name="status-warning" size="24px" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black tracking-tight text-zinc-900">
              {t("loadFailedTitle")}
            </h1>
            <p className="text-sm font-medium leading-relaxed text-zinc-500">
              {t("loadFailedDesc")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50/50">
      <ProtectedPageContainer isLoading>
        <div className="h-10 w-48 rounded-content bg-zinc-100" />
        <div className="h-32 rounded-content bg-zinc-100" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-[420px] rounded-content bg-zinc-100" />
          <div className="h-[420px] rounded-content bg-zinc-100" />
        </div>
        <div className="h-64 rounded-content bg-zinc-100" />
      </ProtectedPageContainer>
    </div>
  );
}
