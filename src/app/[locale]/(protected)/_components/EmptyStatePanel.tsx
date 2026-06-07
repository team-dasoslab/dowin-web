"use client";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
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
      <Card className="max-w-[480px] w-full bg-white border-none rounded-[24px] p-8 md:p-12 space-y-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-dowin-in text-left">
        <div className="space-y-5">
          <div className="w-16 h-16 bg-white border-none rounded-[16px] flex items-center justify-center shadow-sm">
            {icon || <Logo size="32px" className="text-zinc-900" />}
          </div>

          <div className="space-y-2">
            <h1 className="text-[24px] font-black tracking-tight text-zinc-900 leading-none">
              {title}
            </h1>
            <div className="text-[15px] font-medium text-zinc-500 tracking-tight break-keep pt-1">
              {description}
            </div>
          </div>
        </div>

        <div className="pt-2">{actions}</div>
      </Card>
    </div>
  );
}
