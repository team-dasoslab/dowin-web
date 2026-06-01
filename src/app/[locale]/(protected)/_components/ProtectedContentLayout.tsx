"use client";

import { useGetWorkspacesWorkspaceIdBillingMe } from "@/api/generated/billing/billing";
import { SubPageLayout } from "@/app/[locale]/(protected)/_components/SubPageLayout";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  hasWorkspaceOperationalAccess,
  isWorkspaceOperationalPath,
} from "@/lib/client/workspace-operational-access";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";

export function ProtectedContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;
  const profilePath = workspaceId ? `/${workspaceId}/profile` : "/profile";
  const pricingPath = workspaceId ? `/${workspaceId}/pricing` : "/pricing";
  const subscriptionRequiredPath = workspaceId
    ? `/${workspaceId}/subscription-required`
    : "/subscription-required";
  const needsOperationalAccess = isWorkspaceOperationalPath(
    pathname,
    workspaceId,
  );
  const { data: billingResponse } = useGetWorkspacesWorkspaceIdBillingMe(
    workspaceId ?? "",
    {
      query: {
        enabled: Boolean(workspaceId && needsOperationalAccess),
        retry: false,
      },
    },
  );
  const billing =
    billingResponse?.status === 200 ? billingResponse.data : null;
  const isProfilePath =
    pathname === profilePath || pathname.startsWith(`${profilePath}/`);
  const workspaceSettingsPath = workspaceId
    ? `/${workspaceId}/workspace/settings`
    : "/workspace/settings";
  const isWorkspacePath =
    pathname === workspaceSettingsPath ||
    pathname.startsWith(workspaceId ? `/${workspaceId}/workspace/` : "/workspace/");
  
  const isWorkspaceNewPath =
    pathname === "/workspace/new" ||
    pathname.startsWith("/workspace/new/");
  const usesSubPageLayout =
    pathname === "/updates" ||
    pathname === pricingPath ||
    isProfilePath ||
    (isWorkspacePath && !isWorkspaceNewPath);
  const showBackButton = pathname !== profilePath && pathname !== workspaceSettingsPath;

  useEffect(() => {
    if (!needsOperationalAccess || !workspaceId || !billing) {
      return;
    }

    if (!hasWorkspaceOperationalAccess(billing)) {
      router.replace(`/${workspaceId}/subscription-required`);
    }
  }, [billing, needsOperationalAccess, router, workspaceId]);

  if (!usesSubPageLayout) {
    return <>{children}</>;
  }

  return (
    <SubPageLayout showBackButton={showBackButton}>
      {children}
    </SubPageLayout>
  );
}
