"use client";

import { SubPageLayout } from "@/app/[locale]/(protected)/_components/SubPageLayout";
import { usePathname } from "@/i18n/routing";
import React from "react";

export function ProtectedContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isProfilePath =
    pathname === "/profile" || pathname.startsWith("/profile/");
  const usesSubPageLayout = pathname === "/updates" || isProfilePath;
  const showBackButton = pathname !== "/profile";

  if (!usesSubPageLayout) {
    return <>{children}</>;
  }

  return (
    <SubPageLayout showBackButton={showBackButton}>
      {children}
    </SubPageLayout>
  );
}
