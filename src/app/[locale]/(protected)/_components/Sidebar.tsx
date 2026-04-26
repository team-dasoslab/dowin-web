"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetScoreboardsActive } from "@/api/generated/scoreboard/scoreboard";
import { MY_DASHBOARD_LINKS } from "@/app/[locale]/(protected)/dashboard/my/_lib/dashboard-links";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/routing";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";
import { useSidebar } from "@/context/SidebarContext";
import { useTranslations } from "next-intl";

export function Sidebar() {
  const t = useTranslations("Dashboard");
  const commonT = useTranslations("Common");
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const { data: profileResponse, isLoading: isProfileLoading } =
    useGetUsersMe();
  const { data: scoreboardResponse, isLoading: isScoreboardLoading } =
    useGetScoreboardsActive();

  const profile = profileResponse?.status === 200 ? profileResponse.data : null;
  const workspaceName = profile?.workspaceName;
  const role = profile?.role;
  const hasScoreboard =
    scoreboardResponse?.status === 200 && !!scoreboardResponse.data;

  if (isProfileLoading || isScoreboardLoading) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 hidden h-screen flex-col border-r border-zinc-200 bg-white p-4 transition-[width] duration-300 ease-in-out md:flex",
          isCollapsed ? "w-[80px]" : "w-[80px] lg:w-[240px]",
        )}
      >
        <div className="mb-6 flex h-10 w-full animate-pulse items-center justify-center gap-3 rounded-content bg-zinc-100 lg:justify-start lg:px-4" />
        <div className="flex-1 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-11 w-full animate-pulse rounded-button bg-zinc-50"
            />
          ))}
        </div>
      </aside>
    );
  }

  const filteredLinks = MY_DASHBOARD_LINKS.filter((link) => {
    if (link.adminOnly && role !== "ADMIN") return false;
    return true;
  });
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

  const getIsDisabled = (translationKey: string) => {
    const isScoreboardRelated =
      translationKey === "scoreboardArchive" ||
      translationKey === "manageScoreboard";

    return isScoreboardRelated && !hasScoreboard;
  };

  // Main tab paths where the bottom navigation should be visible
  const mainTabPaths = [
    "/",
    "/dashboard",
    "/dashboard/my",
    "/report",
    "/setup",
    "/scoreboards",
    "/profile",
  ];

  const isMainTab = mainTabPaths.includes(pathname);

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-[110] hidden h-screen flex-col border-r border-zinc-200 bg-white transition-[width] duration-300 ease-in-out md:flex",
          isCollapsed ? "w-[64px] p-2" : "w-[80px] p-4 lg:w-[240px]",
        )}
      >
        {/* Workspace Pill */}
        {workspaceName ? (
          <div
            className={cn(
              "mb-6 flex h-10 w-full items-center rounded-content bg-primary/10 transition-all",
              isCollapsed ? "justify-center gap-0 px-0" : "justify-center gap-3 lg:justify-start lg:px-4",
            )}
          >
            <Logo size="20px" className="text-primary" />
            <span
              className={cn(
                "hidden truncate text-sm font-bold text-primary lg:block whitespace-nowrap transition-all duration-300",
                isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100",
              )}
            >
              {workspaceName}
            </span>
          </div>
        ) : (
          <Link
            href="/workspace/new"
            className={cn(
              "mb-6 flex h-10 w-full items-center rounded-button border border-dashed border-primary/40 bg-primary/5 text-primary transition-all hover:bg-primary/10",
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
              const isDisabled = getIsDisabled(translationKey);

              if (isDisabled) {
                return (
                  <div
                    key={href}
                    title={commonT("noScoreboardNotice")}
                    className={cn(
                      "flex h-11 w-full cursor-not-allowed items-center rounded-button text-zinc-300 opacity-50 transition-all",
                      isCollapsed ? "justify-center gap-0 px-0" : "gap-3 px-4",
                    )}
                  >
                    <DowinIcon
                      name={iconNameActive}
                      size="20px"
                      className="shrink-0"
                    />
                    <span
                      className={cn(
                        "hidden text-[14px] font-bold lg:block whitespace-nowrap transition-all duration-300",
                        isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100",
                      )}
                    >
                      {t(translationKey)}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex h-11 w-full items-center rounded-button transition-all",
                    isActive
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-600",
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
              "flex h-11 items-center rounded-button text-zinc-400 transition-all hover:bg-zinc-100/50 hover:text-zinc-600",
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
                const isDisabled = getIsDisabled(translationKey);
                const label = t(translationKey);

                if (isDisabled) {
                  return (
                    <div
                      key={href}
                      title={commonT("noScoreboardNotice")}
                      className="flex min-w-0 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-button px-1 py-2 text-zinc-300 opacity-50"
                    >
                      <DowinIcon name={iconNameActive} size="20px" />
                      <span className="max-w-full truncate text-[10px] font-bold leading-none">
                        {label}
                      </span>
                    </div>
                  );
                }

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
