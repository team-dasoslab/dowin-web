"use client";

import { Zap } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStatePanelProps = {
  title: string;
  description: ReactNode;
  actions: ReactNode;
};

export function EmptyStatePanel({
  title,
  description,
  actions,
}: EmptyStatePanelProps) {
  return (
    <div className="flex justify-center">
      <div className="max-w-[400px] w-full space-y-8">
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
          <Zap className="text-primary w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        </div>

        {actions}
      </div>
    </div>
  );
}
