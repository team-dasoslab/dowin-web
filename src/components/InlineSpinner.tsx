"use client";

type InlineSpinnerProps = {
  className?: string;
  size?: "sm" | "md";
};

export function InlineSpinner({
  className = "",
  size = "md",
}: InlineSpinnerProps) {
  const sizeClassName = size === "sm" ? "w-4 h-4 border-2" : "w-5 h-5 border-2";

  return (
    <div
      className={`${sizeClassName} rounded-full border-white/20 border-t-white animate-spin ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
