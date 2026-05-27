"use client";

import { SubPageLayout } from "@/app/[locale]/(protected)/_components/SubPageLayout";
import { usePathname } from "@/i18n/routing";
import { useParams } from "next/navigation";
import React from "react";

export function ProtectedContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;
  const profilePath = workspaceId ? `/${workspaceId}/profile` : "/profile";
  const pricingPath = workspaceId ? `/${workspaceId}/pricing` : "/pricing";
  const isProfilePath =
    pathname === profilePath || pathname.startsWith(`${profilePath}/`);
  const usesSubPageLayout =
    pathname === "/updates" || pathname === pricingPath || isProfilePath;
  const showBackButton = pathname !== profilePath;

  if (!usesSubPageLayout) {
    return <>{children}</>;
  }

  return (
    <SubPageLayout showBackButton={showBackButton}>
      {children}
    </SubPageLayout>
  );
}
