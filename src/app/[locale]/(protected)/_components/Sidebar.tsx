"use client";

import { MY_DASHBOARD_LINKS } from "@/app/[locale]/(protected)/dashboard/my/_lib/dashboard-links";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/routing";
import { WigIcon } from "@/components/ui/WigIcon";
import { useTranslations } from "next-intl";

interface SidebarProps {
  workspaceName?: string;
  role?: "ADMIN" | "MEMBER";
  hasScoreboard?: boolean;
}

export function Sidebar({
  workspaceName,
  role,
  hasScoreboard = true,
}: SidebarProps) {
  const t = useTranslations("Dashboard");
  const commonT = useTranslations("Common");
  const pathname = usePathname();

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

  return (
    <>
      <aside className="fixed left-0 top-0 hidden h-screen w-[80px] flex-col border-r border-zinc-200 bg-white p-4 md:flex lg:w-[240px]">
        {/* Workspace Pill */}
        {workspaceName ? (
          <div className="mb-6 flex h-10 w-full items-center justify-center gap-3 rounded-content bg-primary/10 lg:justify-start lg:px-4">
            <WigIcon name="domain-flash-active" size="20px" className="text-primary" />
            <span className="hidden truncate text-sm font-bold text-primary lg:block">
              {workspaceName}
            </span>
          </div>
        ) : (
          <Link
            href="/workspace/new"
            className="mb-6 flex h-10 w-full items-center justify-center gap-3 rounded-button border border-dashed border-primary/40 bg-primary/5 text-primary transition-colors hover:bg-primary/10 lg:justify-start lg:px-4"
          >
            <WigIcon name="action-add-active" size="16px" />
            <span className="hidden truncate text-[13px] font-bold lg:block">
              {commonT("createWorkspace")}
            </span>
          </Link>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {filteredLinks.map(({ href, iconName, iconNameActive, translationKey }) => {
            const isActive = getIsActive(href);
            const isDisabled = getIsDisabled(translationKey);

            if (isDisabled) {
              return (
                <div
                  key={href}
                  title={commonT("noScoreboardNotice")}
                  className="flex h-11 w-full cursor-not-allowed items-center gap-3 rounded-button px-4 text-zinc-300 opacity-50"
                >
                  <WigIcon name={iconNameActive} size="20px" className="mx-auto lg:mx-0 shrink-0" />
                  <span className="hidden text-[14px] font-bold lg:block">
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
                  "flex h-11 w-full items-center gap-3 rounded-button px-4 transition-all",
                  isActive
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-600",
                )}
              >
                <WigIcon
                  name={isActive ? iconNameActive : iconName}
                  size="20px"
                  className={cn(
                    "mx-auto shrink-0 transition-transform lg:mx-0",
                    isActive && "scale-105",
                  )}
                />
                <span className="hidden text-[14px] font-bold lg:block">
                  {t(translationKey)}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-zinc-200 bg-white px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden">
        <div className="mx-auto grid max-w-[520px] grid-cols-5 gap-1">
          {mobileLinks.map(({ href, iconName, iconNameActive, translationKey }) => {
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
                  <WigIcon name={iconNameActive} size="20px" />
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
                  isActive
                    ? "text-zinc-950"
                    : "text-zinc-400 active:bg-zinc-100/70",
                )}
              >
                <WigIcon
                  name={isActive ? iconNameActive : iconName}
                  size="20px"
                  className={cn("transition-all", isActive && "scale-105")}
                />
                <span className="max-w-full truncate text-[10px] font-bold leading-none">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
