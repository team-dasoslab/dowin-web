"use client";

import { type WeeklyLogGuide, WeeklyLogGuideKind } from "@/api/generated/wig.schemas";
import { Button } from "@/components/ui/Button";
import { CircleAlert, Compass, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LeadMeasureGuideTooltipProps = {
  active: boolean;
  guide: WeeklyLogGuide;
  onClose: () => void;
  onToggle: () => void;
};

const guideStyles = {
  [WeeklyLogGuideKind.change]: {
    icon: Compass,
    iconClassName: "text-rose-600",
    triggerClassName: "text-rose-600 hover:text-rose-700",
  },
  [WeeklyLogGuideKind.adjust]: {
    icon: SlidersHorizontal,
    iconClassName: "text-amber-500",
    triggerClassName: "text-amber-500 hover:text-amber-600",
  },
} as const;

export function LeadMeasureGuideTooltip({
  active,
  guide,
  onClose,
  onToggle,
}: LeadMeasureGuideTooltipProps) {
  const style = guideStyles[guide.kind];
  const Icon = style.icon;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(
    null,
  );

  useEffect(() => {
    if (!active) {
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setPosition({
                left: Math.max(8, Math.min(rect.left, window.innerWidth - 240)),
                top: rect.bottom + 8,
              });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [active]);

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        className={`inline-flex h-4 w-4 items-center justify-center transition-colors ${style.triggerClassName}`}
        aria-label="선행지표 가이드 보기"
      >
        <CircleAlert className={`h-3 w-3 ${style.iconClassName}`} />
      </Button>

      {active ? (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div
            className="fixed z-20 w-56 rounded-lg border border-border bg-white p-3 shadow-lg"
            style={
              position
                ? {
                    left: position.left,
                    top: position.top - 112,
                  }
                : undefined
            }
          >
            <div className="mb-2 flex items-center gap-1.5">
              <Icon className={`h-3.5 w-3.5 ${style.iconClassName}`} />
              <p className="text-[10px] font-bold text-text-primary">
                {guide.kind === WeeklyLogGuideKind.change
                  ? "선행지표 변경 제안"
                  : "횟수 조정 제안"}
              </p>
            </div>
            <p className="text-[11px] leading-5 text-text-secondary">
              {guide.description}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
