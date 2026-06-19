"use client";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useGetWorkspaces, useGetWorkspacesMe, usePutWorkspacesCurrent } from "@/api/generated/workspace/workspace";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useNativeApp } from "@/context/NativeAppContext";

interface WorkspaceSwitcherProps {
  isCollapsed: boolean;
}

export function WorkspaceSwitcher({}: WorkspaceSwitcherProps) {
  const commonT = useTranslations("Common");
  const [isOpen, setIsOpen] = useState(false);
  const [optimisticWorkspaceId, setOptimisticWorkspaceId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNativeApp = useNativeApp();

  const params = useParams();
  const locale = useLocale();
  const currentWorkspaceId = params.workspaceId as string | undefined;

  const { data: meResponse, isLoading: isMeLoading } = useGetWorkspacesMe();
  const { data: workspacesResponse } = useGetWorkspaces();
  const { mutate: switchWorkspace, isPending } = usePutWorkspacesCurrent({
    mutation: {
      onSuccess: (_, variables) => {
        const newWorkspaceId = variables.data.workspaceId;
        if (currentWorkspaceId) {
          window.location.href = window.location.href.replace(`/${currentWorkspaceId}`, `/${newWorkspaceId}`);
        } else {
          window.location.href = `/${locale}/${newWorkspaceId}/dashboard/my`;
        }
      },
      onError: () => {
        setOptimisticWorkspaceId(null);
      },
    },
  });

  const me = meResponse?.status === 200 ? meResponse.data : null;
  const workspaces = workspacesResponse?.status === 200 ? workspacesResponse.data : [];

  const displayWorkspaceId = optimisticWorkspaceId || currentWorkspaceId || me?.id;
  const activeWorkspace = workspaces.find((ws) => ws.id === displayWorkspaceId) || me;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isMeLoading && !activeWorkspace) {
    return (
      <div
        className={cn(
          "flex h-10 w-[200px] animate-pulse items-center rounded-[12px] bg-border transition-all",
          "px-4",
        )}
      />
    );
  }

  if (!activeWorkspace) {
    return null; // Handle empty state outside or let Sidebar render empty
  }

  return (
    <div className="relative w-[200px] -ml-2" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          "flex h-10 w-fit items-center gap-1.5 rounded-[12px] transition-all px-3",
          isOpen ? "bg-sub-background" : "bg-transparent hover:bg-sub-background/80",
        )}
      >
        <span className="truncate text-[16px] font-bold text-text-primary whitespace-nowrap transition-all duration-300 pt-[2px]">
          {activeWorkspace.name}
        </span>
        <DowinIcon 
          name="nav-chevron-down" 
          size="16px" 
          className={cn("text-text-muted shrink-0 transition-transform duration-200", isOpen && "rotate-180")} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full rounded-[20px] border border-border bg-surface p-2 z-50">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                setIsOpen(false);
                if (ws.id !== activeWorkspace.id && ws.id) {
                  setOptimisticWorkspaceId(ws.id);
                  switchWorkspace({ data: { workspaceId: ws.id } });
                }
              }}
              className={cn(
                "flex w-full items-center rounded-[12px] px-3 py-3 text-[15px] transition-colors hover:bg-sub-background",
                ws.id === activeWorkspace.id ? "font-bold text-text-primary bg-sub-background/50" : "font-medium text-text-secondary"
              )}
            >
              <span className="truncate">{ws.name}</span>
            </button>
          ))}
          <div className="border-t border-border my-2 mx-1" />
          {!isNativeApp && (
            <Link
              href="/workspace/new"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center rounded-[12px] px-3 py-3 text-[14px] transition-colors hover:bg-sub-background text-text-secondary font-bold gap-2"
            >
              <DowinIcon name="action-add-active" size="14px" />
              <span>{commonT("createWorkspace")}</span>
            </Link>
          )}
          <Link
            href="/workspace/join"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center rounded-[12px] px-3 py-3 text-[14px] transition-colors hover:bg-sub-background text-text-secondary font-bold gap-2"
          >
            <DowinIcon name="action-enter" size="14px" />
            <span>{commonT("joinWorkspace")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
