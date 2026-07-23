"use client";
import React from "react";
import { useParams } from "next/navigation";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { getDashboardLinks } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-links";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useNativeApp } from "@/context/NativeAppContext";
import { useSidebarActions } from "@/app/[locale]/(protected)/_hooks/useSidebarActions";

export function Sidebar() {
  const t = useTranslations("Dashboard");
  const commonT = useTranslations("Common");
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;
  const isNativeApp = useNativeApp();

  const { data: profileResponse, isLoading: isProfileLoading } =
    useGetUsersMe();

  const profile = profileResponse?.status === 200 ? profileResponse.data : null;
  const workspaceName = profile?.workspaceName;
  const role = profile?.role;

  const filteredLinks = workspaceId
    ? getDashboardLinks(workspaceId).filter((link) => {
        if (link.adminOnly && role !== "ADMIN") return false;
        return true;
      })
    : [];

  const { getIsActive } = useSidebarActions(pathname, filteredLinks);

  const mainTabPaths = [
    "/dashboard/my",
    "/dashboard",
    "/settings",
    "/profile",
    "/subscription-required",
  ];

  const normalizedPathname =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  const isMainTab =
    normalizedPathname === "/" ||
    normalizedPathname === `/${workspaceId}` ||
    mainTabPaths.some((p) => {
      return (
        normalizedPathname === p ||
        (workspaceId ? normalizedPathname === `/${workspaceId}${p}` : false)
      );
    });

  if (!isMainTab) {
    return null;
  }

  return (
    <>
      <aside className="fixed inset-x-0 top-0 z-[110] hidden lg:flex justify-center h-[68px] bg-surface border-b border-border/40">
        <div className="relative flex h-full items-center w-full max-w-[1200px] px-4 md:px-10 lg:px-12">
          <div className="flex-shrink-0 flex items-center h-full z-10">
            {/* Workspace Pill */}
            {isProfileLoading ? (
              <div className="flex h-11 w-[200px] animate-pulse items-center rounded-2xl bg-border transition-all px-4" />
            ) : workspaceName ? (
              <WorkspaceSwitcher isCollapsed={false} />
            ) : (
              <div className="flex gap-2 w-full">
                {!isNativeApp && (
                  <Link
                    href="/workspace/new"
                    className="flex h-11 flex-1 items-center rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-primary transition-all justify-start gap-3 px-4 hover:bg-primary/10"
                  >
                    <DowinIcon name="action-add-active" size="16px" />
                    <span className="truncate text-[14px] font-bold whitespace-nowrap transition-all duration-300 w-auto opacity-100">
                      {commonT("createWorkspace")}
                    </span>
                  </Link>
                )}
                <Link
                  href="/workspace/join"
                  className={cn(
                    "flex h-11 items-center rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-primary transition-all justify-start gap-3 px-4 hover:bg-primary/10",
                    isNativeApp ? "w-full" : "w-11 px-0 justify-center flex-shrink-0"
                  )}
                  title={commonT("joinWorkspace")}
                >
                  <DowinIcon name="action-enter" size="16px" />
                  {isNativeApp && (
                    <span className="truncate text-[14px] font-bold whitespace-nowrap transition-all duration-300 w-auto opacity-100">
                      {commonT("joinWorkspace")}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Links - Centered Absolutely */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <nav className="flex items-center justify-center gap-1.5 pointer-events-auto">
              {filteredLinks.map(({ href, translationKey }) => {
                const isActive = getIsActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center justify-center min-w-fit whitespace-nowrap transition-all text-[15px] px-5 py-2.5 rounded-2xl",
                      isActive
                        ? "bg-sub-background text-text-primary font-extrabold"
                        : "text-text-muted hover:text-text-primary hover:bg-sub-background/50 font-bold"
                    )}
                  >
                    <span>{t(translationKey)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {isMainTab && (
        <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-border/30 bg-surface px-2 pb-[calc(0.5rem+var(--safe-area-inset-bottom,0px))] pt-2 lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
          <div className="mx-auto grid max-w-[520px] grid-cols-4 gap-1.5">
            {filteredLinks.map(
              ({ href, iconName, iconNameActive, translationKey }) => {
                const isActive = getIsActive(href);
                const label = t(translationKey);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-all duration-300",
                      isActive ? "text-text-primary bg-sub-background" : "text-text-muted hover:bg-sub-background/30",
                    )}
                  >
                    <DowinIcon
                      name={isActive ? iconNameActive : iconName}
                      size="20px"
                      className={cn("transition-all duration-300", isActive && "scale-105")}
                    />
                    <span className={cn(
                      "max-w-full truncate text-[11px] leading-none transition-all",
                      isActive ? "font-bold" : "font-medium"
                    )}>
                      {label}
                    </span>
                  </Link>
                );
              },
            )}
          </div>
        </nav>
      )}
    </>
  );
}
