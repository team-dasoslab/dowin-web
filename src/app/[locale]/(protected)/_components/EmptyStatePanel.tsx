"use client";

import { Card } from "@/components/ui/Card";
import { WigIcon } from "@/components/ui/WigIcon";
import type { ReactNode } from "react";

type EmptyStatePanelProps = {
  title: string;
  description: ReactNode;
  actions: ReactNode;
  icon?: ReactNode;
};

export function EmptyStatePanel({
  title,
  description,
  actions,
  icon,
}: EmptyStatePanelProps) {
  return (
    <div className="flex justify-center w-full">
      <Card className="max-w-[480px] w-full p-10 text-center space-y-6 rounded-content">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-content flex items-center justify-center">
          {icon || <WigIcon name="domain-flash" size="24px" className="text-primary" />}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            {title}
          </h1>
          <div className="text-sm text-text-secondary leading-relaxed">
            {description}
          </div>
        </div>

        <div className="flex justify-center pt-2">{actions}</div>
      </Card>
    </div>
  );
}
