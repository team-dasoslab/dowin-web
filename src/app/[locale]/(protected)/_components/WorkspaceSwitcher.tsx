"use client";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useGetWorkspaces, useGetWorkspacesMe, usePutWorkspacesCurrent } from "@/api/generated/workspace/workspace";
import { Logo } from "@/components/ui/Logo";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";

interface WorkspaceSwitcherProps {
  isCollapsed: boolean;
}

export function WorkspaceSwitcher({ isCollapsed }: WorkspaceSwitcherProps) {
  const commonT = useTranslations("Common");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
          "flex h-10 w-[200px] animate-pulse items-center rounded-[12px] bg-zinc-200 transition-all",
          "px-4",
        )}
      />
    );
  }

  if (!me) {
    return null; // Handle empty state outside or let Sidebar render empty
  }

  return (
    <div className="relative w-[200px] -ml-2" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          "flex h-10 w-fit items-center gap-1.5 rounded-[12px] transition-all px-3",
          isOpen ? "bg-zinc-100" : "bg-transparent hover:bg-zinc-100/80",
        )}
      >
        <span className="truncate text-[16px] font-bold text-zinc-900 whitespace-nowrap transition-all duration-300 pt-[2px]">
          {me.name}
        </span>
        <DowinIcon 
          name="nav-chevron-down" 
          size="16px" 
          className={cn("text-zinc-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full rounded-[20px] border border-zinc-200 bg-white p-2 z-50">
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
                "flex w-full items-center rounded-[12px] px-3 py-3 text-[15px] transition-colors hover:bg-zinc-100",
                ws.id === me.id ? "font-bold text-zinc-900 bg-zinc-50/50" : "font-medium text-zinc-600"
              )}
            >
              <span className="truncate">{ws.name}</span>
            </button>
          ))}
          <div className="border-t border-zinc-100 my-2 mx-1" />
          <Link
            href="/workspace/new"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center rounded-[12px] px-3 py-3 text-[14px] transition-colors hover:bg-zinc-100 text-zinc-600 font-bold gap-2"
          >
            <DowinIcon name="action-add-active" size="14px" />
            <span>{commonT("createWorkspace")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
