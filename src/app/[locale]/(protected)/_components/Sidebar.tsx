"use client";

import { MY_DASHBOARD_LINKS } from "@/app/[locale]/(protected)/dashboard/my/_lib/dashboard-links";
import { Link, usePathname } from "@/i18n/routing";
import { Plus, Zap } from "lucide-react";
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

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[80px] flex-col border-r border-zinc-200 bg-white p-4 md:flex lg:w-[240px]">
      {/* Workspace Pill */}
      {workspaceName ? (
        <div className="mb-6 flex h-10 w-full items-center justify-center gap-3 rounded-content bg-primary/10 lg:justify-start lg:px-4">
          <Zap className="h-5 w-5 text-primary" />
          <span className="hidden truncate text-sm font-bold text-primary lg:block">
            {workspaceName}
          </span>
        </div>
      ) : (
        <Link
          href="/workspace/new"
          className="mb-6 flex h-10 w-full items-center justify-center gap-3 rounded-button border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors lg:justify-start lg:px-4"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden truncate text-[13px] font-bold lg:block">
            {commonT("createWorkspace")}
          </span>
        </Link>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {filteredLinks.map(({ href, icon: Icon, translationKey }) => {
          const hrefPathname = href.split("?")[0];
          const isActive =
            pathname === hrefPathname ||
            (hrefPathname !== "/" &&
              pathname.startsWith(hrefPathname + "/") &&
              !filteredLinks.some((l) => {
                const lPath = l.href.split("?")[0];
                return (
                  lPath !== hrefPathname &&
                  lPath.startsWith(hrefPathname + "/") &&
                  pathname.startsWith(lPath)
                );
              }));

          const isScoreboardRelated =
            translationKey === "scoreboardArchive" ||
            translationKey === "manageScoreboard";
          const isDisabled = isScoreboardRelated && !hasScoreboard;

          if (isDisabled) {
            return (
              <div
                key={href}
                title={commonT("noScoreboardNotice")}
                className="flex h-11 w-full cursor-not-allowed items-center gap-3 rounded-button px-4 text-zinc-300 opacity-50"
              >
                <Icon className="mx-auto h-5 w-5 shrink-0 lg:mx-0" />
                <span className="hidden text-[14px] font-bold lg:block">
                  {t(translationKey) || commonT(translationKey)}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex h-11 w-full items-center gap-3 rounded-button px-4 transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-600"
              }`}
            >
              <Icon
                className={`mx-auto h-5 w-5 shrink-0 transition-transform lg:mx-0 ${isActive ? "scale-110" : ""}`}
              />
              <span className={`hidden text-[14px] font-bold lg:block`}>
                {t(translationKey) || commonT(translationKey)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Profile can go here if needed */}
    </aside>
  );
}
