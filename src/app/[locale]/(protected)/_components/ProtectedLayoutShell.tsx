"use client";

import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import React from "react";

interface ProtectedLayoutShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export function ProtectedLayoutShell({
  children,
  sidebar,
}: ProtectedLayoutShellProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-full flex-col bg-zinc-100">
      {sidebar}
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden md:pt-[64px]"
      >
        {children}
      </main>
    </div>
  );
}
