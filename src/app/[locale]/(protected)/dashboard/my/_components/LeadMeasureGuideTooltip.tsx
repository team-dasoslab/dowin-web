"use client";

import { type WeeklyLogGuide, WeeklyLogGuideKind } from "@/api/generated/wig.schemas";
import { Button } from "@/components/ui/Button";
import { WigIcon } from "@/components/ui/WigIcon";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type LeadMeasureGuideTooltipProps = {
  active: boolean;
  guide: WeeklyLogGuide;
  onClose: () => void;
  onToggle: () => void;
};

const guideStyles = {
  [WeeklyLogGuideKind.change]: {
    icon: "nav-compass",
    iconClassName: "text-rose-600",
    triggerClassName: "text-rose-600 hover:text-rose-700",
  },
  [WeeklyLogGuideKind.adjust]: {
    icon: "nav-settings",
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
  const iconName = style.icon;
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
    const container = document.getElementById("main-scroll-container");
    container?.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      container?.removeEventListener("scroll", updatePosition, true);
    };
  }, [active]);

  const t = useTranslations("Dashboard.My.Guide");

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        className={`inline-flex h-4 w-4 items-center justify-center transition-colors ${style.triggerClassName}`}
        aria-label={t("ariaLabel")}
      >
        <WigIcon name="status-info" size="12px" className={style.iconClassName} />
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
              <WigIcon name={iconName} size="14px" className={style.iconClassName} />
              <p className="text-[10px] font-bold text-text-primary">
                {guide.kind === WeeklyLogGuideKind.change
                  ? t("changeProposal")
                  : t("adjustProposal")}
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
