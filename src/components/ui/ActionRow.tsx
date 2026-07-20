
import { cn } from "@/lib/utils";
import React from "react";

interface ActionRowProps {
  title: string;
  description?: string;
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
          <p className="mt-0.5 text-[13px] text-text-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 sm:ml-4">{action}</div>}
    </div>
  );
}
