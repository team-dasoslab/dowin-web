"use client";

import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import React from "react";

interface ProtectedLayoutShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  localeEnforcer: React.ReactNode;
}

export function ProtectedLayoutShell({
  children,
  sidebar,
  localeEnforcer,
}: ProtectedLayoutShellProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-50/50">
      {localeEnforcer}
      {sidebar}
      <main
        id="main-scroll-container"
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden transition-[padding] duration-300 ease-in-out",
          "md:pl-[80px]",
          isCollapsed ? "lg:pl-[64px]" : "lg:pl-[240px]",
        )}
      >
        {children}
      </main>
    </div>
  );
}
