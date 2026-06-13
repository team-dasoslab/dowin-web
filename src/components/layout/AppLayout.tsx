"use client";

import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout component that respects Safe Area Insets synced from the Native Bridge.
 * It applies paddings based on CSS variables --safe-area-inset-*.
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div
      className="flex h-[100dvh] w-full flex-col overflow-hidden bg-zinc-100"
      style={{
        paddingTop: "var(--safe-area-inset-top, 0px)",
        paddingBottom: "var(--safe-area-inset-bottom, 0px)",
        paddingLeft: "var(--safe-area-inset-left, 0px)",
        paddingRight: "var(--safe-area-inset-right, 0px)",
      }}
    >
      {children}
    </div>
  );
}
