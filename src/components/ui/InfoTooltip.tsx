"use client";

import { DowinIcon } from "@/components/ui/DowinIcon";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface InfoTooltipProps {
  content: React.ReactNode;
  /**
   * label을 넘기면 인라인 모드로 동작합니다.
   * [label] [ⓘ] 한 줄로 렌더되고, 클릭 시 카드 내부에 블록으로 펼쳐집니다.
   */
  label?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  side?: "top" | "bottom";
  triggerClassName?: string;
  activeTriggerClassName?: string;
  triggerIcon?: React.ReactNode;
}

/**
 * ⓘ 아이콘 버튼을 누르면 보조 설명을 보여주는 공통 컴포넌트.
 *
 * - `label` 없음: 아이콘만 렌더, 절대 위치 팝오버로 열림
 * - `label` 있음: 인라인 모드, 카드 내부 흐름 안에서 아래로 펼쳐짐
 *
 * @example
 * // 인라인 (카드 내부)
 * <InfoTooltip label={<h1>제목</h1>} content="설명..." />
 */
export function InfoTooltip({
  content,
  label,
  className,
  align = "left",
  side = "bottom",
  triggerClassName = "text-text-muted hover:text-text-secondary transition-colors",
  activeTriggerClassName = "text-text-primary bg-sub-background",
  triggerIcon = <DowinIcon name="status-info" size="18px" />,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const iconButton = (
    <button
      type="button"
      aria-label="안내 보기"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full ",
        triggerClassName,
        open && activeTriggerClassName,
      )}
    >
      {triggerIcon}
    </button>
  );

  const tooltipAlignClass =
    align === "left"
      ? "left-0"
      : align === "right"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  const tooltipSideClass =
    side === "top" ? "bottom-full mb-2" : "top-full mt-2";

  /* ── 인라인 모드 (label 있음) ── */
  if (label !== undefined) {
    return (
      <div ref={ref} className={cn("relative w-full", className)}>
        <div className="flex items-center gap-2">
          {label}
          {iconButton}
        </div>
        {open && (
          <div
            role="tooltip"
            className={cn(
              "absolute z-50 w-72 max-w-[calc(100vw-4rem)] rounded-[16px] border-none bg-zinc-900 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-dowin-in",
              tooltipAlignClass,
              tooltipSideClass,
            )}
          >
            <div className="text-[14px] font-semibold leading-relaxed text-white whitespace-pre-line">
              {content}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── 팝오버 모드 (label 없음, 아이콘만) ── */
  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center", className)}
    >
      {iconButton}
      {open && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 w-72 max-w-[calc(100vw-2rem)] sm:max-w-none rounded-[16px] border-none bg-zinc-900 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-dowin-in",
            tooltipAlignClass,
            tooltipSideClass,
          )}
        >
          <div className="text-[14px] font-semibold leading-relaxed text-white whitespace-pre-line">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
