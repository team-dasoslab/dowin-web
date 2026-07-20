"use client";

import { type WeeklyLogGuide } from "@/api/generated/dowin.schemas";
import { LeadMeasureGuideTooltip } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/my/_components/LeadMeasureGuideTooltip";
import { Badge } from "@/components/ui/Badge";
import { ValueTrend } from "@/components/ui/ValueTrend";
import { useToast } from "@/context/ToastContext";

import { useTranslations } from "next-intl";
type LeadMeasureSummaryProps = {
  achieved?: number;
  lastWeekAchieved?: number | null;
  guide?: WeeklyLogGuide | null;
  guideActive?: boolean;
  name?: string | null;
  nameClassName?: string;
  onGuideClose?: () => void;
  onGuideToggle?: () => void;
  tags?: Array<{ id?: number | null; name?: string | null }>;
  publicId?: string | null;
  /** "stacked"(default): 2-row layout for my dashboard.
   *  "inline": single-row — trend left of name, for team dashboard. */
  layout?: "stacked" | "inline";
};

export function LeadMeasureSummary({
  achieved,
  lastWeekAchieved,
  guide = null,
  guideActive = false,
  name,
  nameClassName = "text-sm font-semibold text-text-primary",
  onGuideClose,
  onGuideToggle,
  tags = [],
  publicId,
  layout = "stacked",
}: LeadMeasureSummaryProps) {
  const hasGuideActions = Boolean(guide && onGuideClose && onGuideToggle);
  const commonT = useTranslations("Common");
  const { showToast } = useToast();

  const handleCopyId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (publicId) {
      navigator.clipboard.writeText(publicId);
      showToast("success", commonT("copyDone"));
    }
  };

  if (layout === "inline") {
    return (
      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <ValueTrend current={achieved} previous={lastWeekAchieved} />
          {publicId && (
            <Badge
              variant="default"
              shape="default"
              onClick={handleCopyId}
              className="cursor-pointer font-mono font-bold hover:bg-sub-background transition-colors"
              title={commonT("copyDone")}
            >
              {publicId}
            </Badge>
          )}
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
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <Badge
                key={tag.id ?? `${tag.name ?? "tag"}-${index}`}
                variant="primary"
                size="sm"
                shape="pill"
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-w-0 flex flex-col gap-1.5">
      <div className="flex h-[24px] items-center gap-1.5 flex-wrap">
        <ValueTrend current={achieved} previous={lastWeekAchieved} />
        {publicId && (
          <Badge
            variant="default"
            shape="default"
            onClick={handleCopyId}
            className="cursor-pointer font-mono font-bold hover:bg-sub-background transition-colors"
            title={commonT("copyDone")}
          >
            {publicId}
          </Badge>
        )}
      </div>
      <div className="flex h-[36px] items-center gap-1.5 flex-wrap">
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
              variant="primary"
              size="sm"
              shape="pill"
            >
              #{tag.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

