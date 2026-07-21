"use client";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import type { ReactNode } from "react";

type EmptyStatePanelProps = {
  title: string;
  description: ReactNode;
  actions: ReactNode;
  icon?: ReactNode;
  align?: "left" | "center";
};

export function EmptyStatePanel({
  title,
  description,
  actions,
  icon,
  align = "left",
}: EmptyStatePanelProps) {
  const isCenter = align === "center";

  return (
    <div className="flex justify-center w-full">
      <Card
        className={`max-w-[480px] w-full animate-dowin-in ${isCenter ? "text-center flex flex-col items-center space-y-8" : "text-left space-y-10"}`}
        radius="xl"
        padding="xl"
        variant="subtle"
      >
        <div className={`space-y-5 w-full ${isCenter ? "flex flex-col items-center" : ""}`}>
          {icon || <Logo size="32px" className="text-text-primary" />}

          <div className="space-y-2">
            <h1 className="text-[24px] font-black tracking-tight text-text-primary leading-none">
              {title}
            </h1>
            <div className="text-[15px] font-medium text-text-muted tracking-tight break-keep pt-1">
              {description}
            </div>
          </div>
        </div>

        <div className="pt-2">{actions}</div>
      </Card>
    </div>
  );
}
