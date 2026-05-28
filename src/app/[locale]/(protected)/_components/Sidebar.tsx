"use client";
import { useParams } from "next/navigation";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { getDashboardLinks } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-links";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/routing";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useSidebar } from "@/context/SidebarContext";
import { useTranslations } from "next-intl";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function Sidebar() {
  const t = useTranslations("Dashboard");
  const commonT = useTranslations("Common");
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;
  const { isCollapsed, toggleSidebar } = useSidebar();

  const { data: profileResponse, isLoading: isProfileLoading } =
    useGetUsersMe();

  const profile = profileResponse?.status === 200 ? profileResponse.data : null;
  const workspaceName = profile?.workspaceName;
  const role = profile?.role;

  const filteredLinks = workspaceId ? getDashboardLinks(workspaceId).filter((link) => {
    if (link.adminOnly && role !== "ADMIN") return false;
    return true;
  }) : [];

  const mobileLinks = filteredLinks.filter(
    (link) => link.translationKey !== "weeklyReport",
  );

  const getIsActive = (href: string) => {
    const hrefPathname = href.split("?")[0];

    return (
      pathname === hrefPathname ||
      (hrefPathname !== "/" &&
        pathname.startsWith(hrefPathname + "/") &&
        !filteredLinks.some((link) => {
          const linkPathname = link.href.split("?")[0];
          return (
            linkPathname !== hrefPathname &&
            linkPathname.startsWith(hrefPathname + "/") &&
            pathname.startsWith(linkPathname)
          );
        }))
    );
  };

  const mainTabPaths = [
    "/dashboard",
    "/dashboard/my",
    "/report",
    "/setup",
    "/scoreboards",
    "/workspace/settings",
    "/profile",
  ];

  const isMainTab =
    pathname === "/" ||
    pathname === `/${workspaceId}` ||
    mainTabPaths.some((p) => pathname.includes(p));

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-[110] hidden h-screen flex-col border-r border-zinc-200 bg-white transition-[width] duration-300 ease-in-out md:flex",
          isCollapsed ? "w-[64px] p-2" : "w-[80px] p-4 lg:w-[240px]",
        )}
      >
        {/* Workspace Pill */}
        {isProfileLoading ? (
          <div
            className={cn(
              "mb-6 flex h-10 w-full animate-pulse items-center rounded-content bg-zinc-100 transition-all",
              isCollapsed ? "justify-center" : "lg:px-4",
            )}
          />
        ) : workspaceName ? (
          <WorkspaceSwitcher isCollapsed={isCollapsed} />
        ) : (
          <Link
            href="/workspace/new"
            className={cn(
              "mb-6 flex h-10 w-full items-center rounded-button border border-dashed border-primary/40 bg-primary/5 text-primary transition-all",
              isCollapsed ? "justify-center gap-0 px-0" : "justify-center gap-3 lg:justify-start lg:px-4",
            )}
          >
            <DowinIcon name="action-add-active" size="16px" />
            <span
              className={cn(
                "hidden truncate text-[13px] font-bold lg:block whitespace-nowrap transition-all duration-300",
                isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100",
              )}
            >
              {commonT("createWorkspace")}
            </span>
          </Link>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {filteredLinks.map(
            ({ href, iconName, iconNameActive, translationKey }) => {
              const isActive = getIsActive(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex h-11 w-full items-center rounded-button transition-all",
                    isActive
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-400",
                    isCollapsed ? "justify-center gap-0 px-0" : "gap-3 px-4",
                  )}
                >
                  <DowinIcon
                    name={isActive ? iconNameActive : iconName}
                    size="20px"
                    className={cn(
                      "shrink-0 transition-transform",
                      isActive && "scale-105",
                    )}
                  />
                  <span
                    className={cn(
                      "hidden text-[14px] font-bold lg:block whitespace-nowrap transition-all duration-300",
                      isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100",
                    )}
                  >
                    {t(translationKey)}
                  </span>
                </Link>
              );
            },
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="hidden lg:block">
          <button
            onClick={toggleSidebar}
            className={cn(
              "flex h-11 items-center rounded-button text-zinc-400 transition-all",
              isCollapsed ? "w-full justify-center px-0" : "ml-auto w-11 justify-center",
            )}
            title={isCollapsed ? commonT("open") : commonT("close")}
          >
            <DowinIcon
              name={isCollapsed ? "nav-chevron-right" : "nav-chevron-left"}
              size="20px"
              className="shrink-0"
            />
          </button>
        </div>
      </aside>

      {isMainTab && (
        <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white px-1 pb-[calc(0.5rem+var(--safe-area-inset-bottom,0px))] pt-2 md:hidden">
          <div className="mx-auto grid max-w-[520px] grid-cols-5 gap-1">
            {mobileLinks.map(
              ({ href, iconName, iconNameActive, translationKey }) => {
                const isActive = getIsActive(href);
                const label = t(translationKey);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex min-w-0 flex-col items-center justify-center gap-1 rounded-button px-1 py-2 transition-colors",
                      isActive ? "text-zinc-950" : "text-zinc-400",
                    )}
                  >
                    <DowinIcon
                      name={isActive ? iconNameActive : iconName}
                      size="20px"
                      className={cn("transition-all", isActive && "scale-105")}
                    />
                    <span className="max-w-full truncate text-[10px] font-bold leading-none">
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
