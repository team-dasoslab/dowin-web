import { RefObject, useEffect, useState } from "react";

export const useLeadMeasureGuideTooltipPosition = (
  active: boolean | undefined,
  triggerRef: RefObject<HTMLButtonElement | null>,
) => {
  const [position, setPosition] = useState<{
    left: number;
    bottom: number;
  } | null>(null);

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
  }, [active, triggerRef]);

  return { position };
};
