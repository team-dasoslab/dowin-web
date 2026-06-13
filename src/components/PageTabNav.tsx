import React from "react";
import { cn } from "@/lib/utils";

export type TabNavItem = {
  id: string;
  label: React.ReactNode;
};

type PageTabNavProps = {
  items: TabNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
  containerClassName?: string;
};

export function PageTabNav({
  items,
  activeId,
  onSelect,
  className,
  containerClassName,
}: PageTabNavProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 w-full bg-surface/95 backdrop-blur-sm border-b border-border",
        containerClassName,
      )}
    >
      <nav
        className={cn(
          "flex overflow-x-auto scrollbar-none px-4 md:px-0 lg:max-w-[800px] lg:mx-auto gap-6",
          className,
        )}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 transition-all font-semibold text-[15px]",
                isActive
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-text-muted hover:text-text-primary hover:border-border-hover",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
