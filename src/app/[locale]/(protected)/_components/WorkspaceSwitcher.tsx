"use client";

import {
  useGetWorkspaces,
  useGetWorkspacesMe,
  usePutWorkspacesCurrent,
} from "@/api/generated/workspace/workspace";
import { useWorkspaceSwitcherActions } from "@/app/[locale]/(protected)/_hooks/useWorkspaceSwitcherActions";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useNativeApp } from "@/context/NativeAppContext";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

interface WorkspaceSwitcherProps {
  isCollapsed: boolean;
}

export function WorkspaceSwitcher({}: WorkspaceSwitcherProps) {
  const commonT = useTranslations("Common");
  const [isOpen, setIsOpen] = useState(false);
  const [optimisticWorkspaceId, setOptimisticWorkspaceId] = useState<
    string | null
  >(null);
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
          window.location.href = window.location.href.replace(
            `/${currentWorkspaceId}`,
            `/${newWorkspaceId}`,
          );
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
  const workspaces =
    workspacesResponse?.status === 200 ? workspacesResponse.data : [];

  const displayWorkspaceId =
    optimisticWorkspaceId || currentWorkspaceId || me?.id;
  const activeWorkspace =
    workspaces.find((ws) => ws.id === displayWorkspaceId) || me;

  useWorkspaceSwitcherActions(containerRef, setIsOpen);

  if (isMeLoading && !activeWorkspace) {
    return (
      <div className="flex h-11 w-[200px] animate-pulse items-center rounded-2xl bg-border transition-all px-4" />
    );
  }

  if (!activeWorkspace) {
    return null;
  }

  return (
    <div className="relative w-full min-w-[200px]" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          "flex h-11 w-fit items-center gap-2 transition-all px-4 rounded-2xl bg-sub-background hover:bg-sub-background/80",
          isOpen && "bg-sub-background shadow-inner"
        )}
      >
        <span className="truncate text-[16px] font-extrabold text-text-primary whitespace-nowrap transition-all duration-300 pt-[2px]">
          {activeWorkspace.name}
        </span>
        <DowinIcon
          name="nav-chevron-down"
          size="16px"
          className={cn(
            "shrink-0 transition-transform duration-200 text-text-muted",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[240px] rounded-2xl border border-border bg-surface p-2 z-50 shadow-lg">
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
                "flex w-full items-center rounded-xl px-4 py-3.5 text-[15px] transition-colors hover:bg-sub-background",
                ws.id === activeWorkspace.id
                  ? "font-extrabold text-text-primary bg-sub-background/50"
                  : "font-bold text-text-secondary"
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
              className="flex w-full items-center rounded-xl px-4 py-3.5 text-[15px] transition-colors hover:bg-sub-background text-text-secondary font-bold gap-2"
            >
              <DowinIcon name="action-add-active" size="16px" />
              <span>{commonT("createWorkspace")}</span>
            </Link>
          )}
          <Link
            href="/workspace/join"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center rounded-xl px-4 py-3.5 text-[15px] transition-colors hover:bg-sub-background text-text-secondary font-bold gap-2"
          >
            <DowinIcon name="action-enter" size="16px" />
            <span>{commonT("joinWorkspace")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
