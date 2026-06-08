"use client";

import { type WeeklyLogGuide, WeeklyLogGuideKind } from "@/api/generated/dowin.schemas";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type LeadMeasureGuideTooltipProps = {
  active?: boolean;
  guide: WeeklyLogGuide;
  onClose?: () => void;
  onToggle?: () => void;
};

const guideStyles = {
  [WeeklyLogGuideKind.change]: {
    popupIconClassName: "text-rose-500",
    buttonClassName: "text-rose-400 hover:text-rose-600 hover:bg-rose-50",
    activeClassName: "text-rose-600 bg-rose-100",
  },
  [WeeklyLogGuideKind.adjust]: {
    popupIconClassName: "text-amber-500",
    buttonClassName: "text-amber-400 hover:text-amber-600 hover:bg-amber-50",
    activeClassName: "text-amber-600 bg-amber-100",
  },
} as const;

export function LeadMeasureGuideTooltip({
  active,
  guide,
  onClose,
  onToggle,
}: LeadMeasureGuideTooltipProps) {
  const style = guideStyles[guide.kind];
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [position, setPosition] = useState<{ left: number; bottom: number } | null>(
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
        // Align left with padding, keeping it within window width
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 296)), // 296 is w-72 (288) + 8px padding
        // Position above the button
        bottom: window.innerHeight - rect.top + 8,
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
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={active}
        onClick={(e) => {
          e.stopPropagation();
          if (onToggle) onToggle();
        }}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors active:scale-[0.95] ${
          active ? style.activeClassName : style.buttonClassName
        }`}
        aria-label={t("ariaLabel")}
      >
        <DowinIcon name="status-info" size="18px" />
      </button>

      {active ? (
        <>
          <div className="fixed inset-0 z-[100]" onClick={onClose} />
          <div
            className="fixed z-[110] w-72 max-w-[calc(100vw-2rem)] sm:max-w-none rounded-[16px] border-none bg-zinc-900 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-dowin-in"
            style={
              position
                ? {
                    left: position.left,
                    bottom: position.bottom,
                  }
                : undefined
            }
          >
            <div className="mb-2 flex items-center gap-1.5">
              <p className="text-[14px] font-semibold leading-relaxed text-white">
                {guide.kind === WeeklyLogGuideKind.change
                  ? t("changeProposal")
                  : t("adjustProposal")}
              </p>
            </div>
            <p className="text-[14px] font-semibold leading-relaxed text-white/80 mt-2">
              {guide.kind === WeeklyLogGuideKind.change
                ? t("changeProposalDesc")
                : t("adjustProposalDesc")}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
