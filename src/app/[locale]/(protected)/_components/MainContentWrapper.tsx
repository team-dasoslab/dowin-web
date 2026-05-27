"use client";

import { usePathname } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";

interface MainContentWrapperProps {
  children: React.ReactNode;
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;

  // Main tab paths where the bottom navigation is visible
  const mainTabPaths = [
    "/",
    workspaceId ? `/${workspaceId}/dashboard` : "/dashboard",
    workspaceId ? `/${workspaceId}/dashboard/my` : "/dashboard/my",
    workspaceId ? `/${workspaceId}/report` : "/report",
    workspaceId ? `/${workspaceId}/setup` : "/setup",
    workspaceId ? `/${workspaceId}/scoreboards` : "/scoreboards",
    workspaceId ? `/${workspaceId}/profile` : "/profile",
  ];

  const isMainTab = mainTabPaths.includes(pathname);

  return (
    <div
      className={cn(
        "transition-[padding] duration-200 ease-out md:pb-0",
        isMainTab 
          ? "pb-[calc(5.25rem+var(--safe-area-inset-bottom,0px))]" 
          : "pb-[var(--safe-area-inset-bottom,0px)]"
      )}
    >
      {children}
    </div>
  );
}
