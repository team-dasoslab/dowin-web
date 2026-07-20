
import { cn } from "@/lib/utils";
import React from "react";

interface ActionRowProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function ActionRow({
  title,
  description,
  action,
  className,
}: ActionRowProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3", className)}>
      <div>
        <p className="text-[15px] font-bold text-text-primary">{title}</p>
        {description && (
          <div className="mt-1 flex items-center gap-2 text-[13px] text-text-muted">{description}</div>
        )}
      </div>
      {action && <div className="shrink-0 sm:ml-4">{action}</div>}
    </div>
  );
}
