import React from "react";
import { cn } from "@/lib/utils";

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
  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id);
      return;
    }
    const element = document.getElementById(id);
    const container = document.getElementById("main-scroll-container");
    if (container && element) {
      const headerOffset = 100;
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;
      container.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <aside
      className={cn(
        "scrollbar-none sticky top-0 z-20 -mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto bg-zinc-100/95 px-4 py-2 backdrop-blur lg:top-12 lg:z-auto lg:mx-0 lg:block lg:w-[240px] lg:space-y-8 lg:overflow-visible lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none",
        containerClassName,
      )}
    >
      <nav className={cn("flex gap-2 lg:block lg:space-y-2", className)}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={cn(
                "flex shrink-0 items-center rounded-[14px] px-4 py-3 text-left text-[15px] font-bold transition-all lg:w-full",
                isActive
                  ? "bg-white text-zinc-900"
                  : "text-zinc-500 hover:bg-white/50",
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
