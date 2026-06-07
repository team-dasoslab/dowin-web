"use client";

import { type WeeklyLogGuide } from "@/api/generated/dowin.schemas";
import { LeadMeasureGuideTooltip } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/LeadMeasureGuideTooltip";
import { Badge } from "@/components/ui/Badge";

type LeadMeasureSummaryProps = {
  guide?: WeeklyLogGuide | null;
  guideActive?: boolean;
  name?: string | null;
  nameClassName?: string;
  onGuideClose?: () => void;
  onGuideToggle?: () => void;
  tags?: Array<{ id?: number | null; name?: string | null }>;
};

export function LeadMeasureSummary({
  guide = null,
  guideActive = false,
  name,
  nameClassName = "text-sm font-semibold text-zinc-900",
  onGuideClose,
  onGuideToggle,
  tags = [],
}: LeadMeasureSummaryProps) {
  const hasGuideActions = Boolean(guide && onGuideClose && onGuideToggle);

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1">
        <p className={`min-w-0 truncate ${nameClassName}`}>{name}</p>
        {guide && hasGuideActions ? (
          <LeadMeasureGuideTooltip
            active={guideActive}
            guide={guide}
            onClose={onGuideClose!}
            onToggle={onGuideToggle!}
          />
        ) : null}
      </div>
      {tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <Badge
              key={tag.id ?? `${tag.name ?? "tag"}-${index}`}
              className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
            >
              #{tag.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
