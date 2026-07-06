"use client";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { EmptyStatePanel } from "@/app/[locale]/(protected)/_components/EmptyStatePanel";
import { NoWorkspaceActions } from "@/app/[locale]/(protected)/_components/NoWorkspaceActions";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { useProfileBillingActions } from "@/app/[locale]/(protected)/workspace/billing/_hooks/useProfileBillingActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useNativeApp } from "@/context/NativeAppContext";
import { Link } from "@/i18n/routing";
import { formatDateLabel } from "@/lib/client/date-utils";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { getWorkspacePath } from "@/lib/client/workspace-path";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export function PricingPageClient() {
  const t = useTranslations("Pricing");
  const params = useParams();
  const locale = useLocale();
  const isNativeApp = useNativeApp();
  const { data: workspaceResponse } = useGetWorkspacesMe();
  const workspaceId =
    (params.workspaceId as string | undefined) ??
    (workspaceResponse?.status === 200
      ? (workspaceResponse.data.id ?? "")
      : "");
  const {
    data: billingResponse,
    error,
    isLoading,
  } = useGetWorkspacesWorkspaceIdBillingMe(workspaceId, {
    query: {
      retry: false,
      enabled: Boolean(workspaceId),
    },
  });
  const { openPortal, isPortalPending } = useProfileBillingActions(workspaceId);

  const hasNoWorkspace = getApiErrorStatus(error) === 404;
  const billing = billingResponse?.status === 200 ? billingResponse.data : null;
  const canManageViaPolar =
    Boolean(billing?.canManageBilling) &&
    billing?.entitlementSource === "POLAR" &&
    (billing.billingStatus === "ACTIVE" ||
      billing.billingStatus === "CANCELED");

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

  return (
    <div className="min-h-screen">
      <ProtectedPageContainer className="space-y-8 lg:space-y-12 pb-24 md:pb-10 lg:pb-12">
        <ProtectedPageHeader
          title={t("header")}
          description={t("description")}
        />

        <Card className="space-y-5 border-border bg-surface" padding="lg">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-text-muted">
                {billing.workspaceName}
              </p>
              <h2 className="text-xl font-black tracking-tight text-text-primary">
                {t("heroTitle")}
              </h2>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-content bg-sub-background text-primary">
              <DowinIcon name="domain-wallet" size="24px" />
            </div>
          </div>

          <div className="grid gap-3 rounded-content border border-border bg-sub-background/60 p-4 sm:grid-cols-3">
            <InfoItem label={t("planLabel")} value={t("basicPlanName")} />
            <InfoItem
              label={t("statusLabel")}
              value={t(`status.${billing.billingStatus}`)}
            />
            <InfoItem
              label={t("periodEndLabel")}
              value={formatDateLabel(
                billing.currentPeriodEnd,
                t("notAvailable"),
                locale,
              )}
            />
          </div>

          {!billing.canManageBilling ? (
            <div className="rounded-content border border-border bg-sub-background px-4 py-3 text-[12px] font-medium leading-relaxed text-text-muted">
              {t("memberNotice")}
            </div>
          ) : null}

          {billing.entitlementSource &&
          billing.entitlementSource !== "POLAR" ? (
            <div className="rounded-content border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[12px] font-medium leading-relaxed text-amber-500">
              <span>
                {t.rich("nonPolarEntitlementNotice", {
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

          {canManageViaPolar ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => void openPortal()}
              disabled={isPortalPending}
              className="h-11 w-full text-sm font-black sm:w-auto sm:px-6"
            >
              {isPortalPending ? t("portalLoading") : t("portalButton")}
            </Button>
          ) : null}
        </Card>

        <section className="space-y-4">
          <SectionHeader
            title={t("cancelGuideTitle")}
            description={t("cancelGuideDesc")}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <GuideCard
              title={t("cancelStep1Title")}
              desc={t("cancelStep1Desc")}
            />
            <GuideCard
              title={t("cancelStep2Title")}
              desc={t("cancelStep2Desc")}
            />
            <GuideCard
              title={t("cancelStep3Title")}
              desc={t("cancelStep3Desc")}
            />
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
      <p className="text-sm font-black text-text-primary">{value}</p>
    </div>
  );
}

function GuideCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="space-y-2 border-border bg-surface" padding="default">
      <h3 className="text-[14px] font-black text-text-primary">{title}</h3>
      <p className="text-[12px] font-medium leading-relaxed text-text-muted">
        {desc}
      </p>
    </Card>
  );
}

function PricingUnavailableInAppState() {
  const t = useTranslations("Pricing");
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
              variant="outline"
              size="primary"
              className="bg-surface font-black transition-colors"
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

function NoWorkspaceState() {
  const t = useTranslations("Pricing");

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card
          className="w-full space-y-6 border-border bg-surface text-center"
          padding="lg"
          shadow="xl"
        >
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
        </Card>
      </div>
    </div>
  );
}

function PricingErrorState() {
  const t = useTranslations("Pricing");

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card
          className="w-full space-y-6 border-border bg-surface text-center"
          padding="lg"
          shadow="xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <DowinIcon name="status-warning" size="24px" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black tracking-tight text-text-primary">
              {t("loadFailedTitle")}
            </h1>
            <p className="text-sm font-medium leading-relaxed text-text-muted">
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
    <div className="min-h-screen">
      <ProtectedPageContainer isLoading className="pb-24 md:pb-10 lg:pb-12">
        <div className="h-10 w-48 rounded-content bg-border" />
        <div className="h-56 rounded-content bg-border" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 rounded-content bg-border" />
          <div className="h-32 rounded-content bg-border" />
          <div className="h-32 rounded-content bg-border" />
        </div>
      </ProtectedPageContainer>
    </div>
  );
}
