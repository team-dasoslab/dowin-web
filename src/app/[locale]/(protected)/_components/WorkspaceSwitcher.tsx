"use client";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useGetWorkspaces, useGetWorkspacesMe, usePutWorkspacesCurrent } from "@/api/generated/workspace/workspace";
import { Logo } from "@/components/ui/Logo";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useState, useRef, useEffect } from "react";

interface WorkspaceSwitcherProps {
  isCollapsed: boolean;
}

export function WorkspaceSwitcher({ isCollapsed }: WorkspaceSwitcherProps) {
  const commonT = useTranslations("Common");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: meResponse, isLoading: isMeLoading } = useGetWorkspacesMe();
  const { data: workspacesResponse } = useGetWorkspaces();
  const { mutate: switchWorkspace, isPending } = usePutWorkspacesCurrent({
    mutation: {
      onSuccess: () => {
        // Hard reload to ensure all states are reset for the new workspace context
        window.location.reload();
      },
    },
  });

  const me = meResponse?.status === 200 ? meResponse.data : null;
  const workspaces = workspacesResponse?.status === 200 ? workspacesResponse.data : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isMeLoading) {
    return (
      <div
        className={cn(
          "mb-6 flex h-10 w-full animate-pulse items-center rounded-content bg-zinc-100 transition-all",
          isCollapsed ? "justify-center" : "lg:px-4",
        )}
      />
    );
  }

  if (!me) {
    return null; // Handle empty state outside or let Sidebar render empty
  }

  return (
    <div className="relative mb-6 w-full" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          "flex h-10 w-full items-center rounded-content bg-primary/10 transition-all hover:bg-primary/15",
          isCollapsed ? "justify-center gap-0 px-0" : "justify-between gap-3 lg:px-4",
        )}
      >
        <div className={cn("flex items-center overflow-hidden", isCollapsed ? "gap-0" : "gap-3")}>
          <Logo size="20px" className="text-primary shrink-0" />
          <span
            className={cn(
              "hidden truncate text-sm font-bold text-primary lg:block whitespace-nowrap transition-all duration-300",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            {me.name}
          </span>
        </div>
        {!isCollapsed && (
          <DowinIcon name="nav-chevron-down" size="16px" className="text-primary shrink-0 hidden lg:block" />
        )}
      </button>

      {isOpen && !isCollapsed && (
        <div className="absolute top-full left-0 mt-1 w-full rounded-content border border-zinc-200 bg-white py-1 shadow-lg z-50">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                setIsOpen(false);
                if (ws.id !== me.id && ws.id) {
                  switchWorkspace({ data: { workspaceId: ws.id } });
                }
              }}
              className={cn(
                "flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-zinc-100",
                ws.id === me.id ? "font-bold text-primary" : "text-zinc-700"
              )}
            >
              <span className="truncate">{ws.name}</span>
            </button>
          ))}
          <div className="border-t border-zinc-100 my-1" />
          <Link
            href="/workspace/new"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-zinc-100 text-primary font-medium gap-2"
          >
            <DowinIcon name="action-add-active" size="14px" />
            <span>{commonT("createWorkspace")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
