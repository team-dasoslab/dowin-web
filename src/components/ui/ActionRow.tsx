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
    <Card className={cn("bg-white px-5 py-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          {description && (
            <p className="mt-0.5 text-[11px] text-text-muted">{description}</p>
          )}
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
      </div>
    </Card>
  );
}
