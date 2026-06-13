"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import type { DocsViewerHeading } from "@/app/[locale]/(public)/docs-viewer/_lib/docs-index";

export function DocumentOutlineClient({
  headings,
  title,
  emptyText,
}: {
  headings: DocsViewerHeading[];
  title: string;
  emptyText: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let currentActive: string | null = null;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            currentActive = entry.target.id;
          }
        });
        
        if (currentActive) {
          setActiveId(currentActive);
        }
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    const headingElements = document.querySelectorAll("h2, h3, h4, h5, h6");
    headingElements.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [headings]);

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <SectionHeader title={title} />
      <div className="mt-4 space-y-1 max-h-[60vh] overflow-y-auto pr-2">
        {headings.length > 0 ? (
          headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={cn(
                "block rounded-lg px-3 py-1.5 text-[13.5px] transition-colors",
                activeId === heading.id
                  ? "bg-zinc-100 text-text-primary font-bold"
                  : "text-zinc-600",
                heading.depth === 1 && "font-bold text-text-primary",
                heading.depth === 2 && "pl-5 text-[13px]",
                heading.depth === 3 && "pl-8 text-[13px]",
                heading.depth >= 4 && "pl-11 text-[13px]"
              )}
            >
              {heading.text}
            </a>
          ))
        ) : (
          <p className="text-sm text-zinc-400">{emptyText}</p>
        )}
      </div>
    </Card>
  );
}
