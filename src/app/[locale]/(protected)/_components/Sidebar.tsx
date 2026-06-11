"use client";
import { useParams } from "next/navigation";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { getDashboardLinks } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_lib/dashboard-links";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function Sidebar() {
  const t = useTranslations("Dashboard");
  const commonT = useTranslations("Common");
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params.workspaceId as string | undefined;

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

  const getIsActive = (href: string) => {
    const hrefPathname = href.split("?")[0];

    // 워크스페이스 하위 메뉴(billing, members, invites) 진입 시에도 '워크스페이스 설정' 메뉴가 active 되도록 예외 처리
    const isWorkspaceMenu =
      hrefPathname.endsWith("/workspace/settings") &&
      pathname.includes("/workspace/");

    return (
      pathname === hrefPathname ||
      isWorkspaceMenu ||
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
    "/workspace/report",
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
      <aside className="fixed inset-x-0 top-4 z-[110] hidden lg:flex justify-center px-4 md:px-6 pointer-events-none">
        <div className="flex h-[64px] items-center justify-between w-full max-w-[1200px] rounded-full bg-white/95 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-zinc-200/80 px-4 md:px-6 gap-8 pointer-events-auto">
          <div className="flex-shrink-0 w-[200px]">
            {/* Workspace Pill */}
            {isProfileLoading ? (
              <div className="flex h-10 w-full animate-pulse items-center rounded-content bg-zinc-200 transition-all px-4" />
            ) : workspaceName ? (
              <WorkspaceSwitcher isCollapsed={false} />
            ) : (
              <Link
                href="/workspace/new"
                className="flex h-10 w-full items-center rounded-button border border-dashed border-primary/40 bg-primary/5 text-primary transition-all justify-start gap-3 px-4"
              >
                <DowinIcon name="action-add-active" size="16px" />
                <span className="truncate text-[13px] font-bold whitespace-nowrap transition-all duration-300 w-auto opacity-100">
                  {commonT("createWorkspace")}
                </span>
              </Link>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-none h-full">
            <nav className="flex items-center justify-center gap-1 p-1">
              {filteredLinks.map(({ href, translationKey }) => {
                const isActive = getIsActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center justify-center px-5 py-2 min-w-fit whitespace-nowrap rounded-[12px] transition-all text-[14px] font-bold",
                      isActive
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50",
                    )}
                  >
                    <span>{t(translationKey)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="w-[200px] flex-shrink-0" />
        </div>
      </aside>

      {isMainTab && (
        <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white px-1 pb-[calc(0.5rem+var(--safe-area-inset-bottom,0px))] pt-2 lg:hidden">
          <div className="mx-auto grid max-w-[520px] grid-cols-4 gap-1">
            {filteredLinks.map(
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
