import { usePageSidebarNavActions } from "@/components/_hooks/usePageSidebarNavActions";
import { cn } from "@/lib/utils";
import React from "react";

export type SidebarNavItem = {
  id: string;
  label: React.ReactNode;
};

type PageSidebarNavProps = {
  items: SidebarNavItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  className?: string;
  containerClassName?: string;
  bottomContent?: React.ReactNode;
};

export function PageSidebarNav({
  items,
  activeId,
  onSelect,
  className,
  containerClassName,
  bottomContent,
}: PageSidebarNavProps) {
  const { handleSelect } = usePageSidebarNavActions(onSelect);
  return (
    <aside
      className={cn(
        "hidden lg:sticky lg:top-12 lg:block lg:w-[240px] lg:space-y-8",
        containerClassName,
      )}
    >
      <nav className={cn("space-y-2", className)}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={cn(
                "flex w-full items-center rounded-[14px] px-4 py-3 text-left text-[15px] font-bold transition-all",
                isActive
                  ? "bg-surface text-text-primary"
                  : "text-text-muted hover:bg-surface/50",
              )}
            >
              <div className="flex items-center gap-3">
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {bottomContent && (
        <div className="hidden space-y-8 lg:block">{bottomContent}</div>
      )}
    </aside>
  );
}
