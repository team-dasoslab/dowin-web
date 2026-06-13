import { Card } from "@/components/ui/Card";
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
    <Card className={cn("bg-surface px-5 py-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          {description && (
            <p className="mt-0.5 text-[11px] text-text-muted">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0 sm:ml-4">{action}</div>}
      </div>
    </Card>
  );
}
