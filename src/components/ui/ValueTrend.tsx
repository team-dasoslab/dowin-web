import React from "react";

type ValueTrendProps = {
  current?: number | null;
  previous?: number | null;
  className?: string;
};

export function ValueTrend({ current, previous, className = "" }: ValueTrendProps) {
  if (typeof current !== "number" || typeof previous !== "number" || previous === null) {
    return null;
  }
  
  const diff = current - previous;
  const isUp = diff > 0;
  const isSame = diff === 0;
  
  return (
    <span className={`inline-block min-w-[22px] text-center text-[10.5px] font-bold leading-none shrink-0 ${
      isUp ? "text-green-500" :
      isSame ? "text-text-muted" : "text-red-500"
    } ${className}`.trim()}>
      {isUp ? `▲ ${diff}` : isSame ? "−" : `▼ ${Math.abs(diff)}`}
    </span>
  );
}
