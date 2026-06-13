import { cn } from "@/lib/utils";
import React, { useId } from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  const id = useId();
  const maskId = `mask0_${id.replace(/:/g, "_")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      {...props}
    >
      <circle cx="300" cy="300" r="300" fill="currentColor" />
      <mask
        id={maskId}
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="600"
        height="600"
      >
        <circle cx="300" cy="300" r="300" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <rect
          x="481"
          y="-140"
          width="795"
          height="40"
          transform="rotate(90 481 -140)"
          fill="var(--color-background)"
        />
        <rect
          x="401"
          y="-140"
          width="795"
          height="40"
          transform="rotate(90 401 -140)"
          fill="var(--color-background)"
        />
        <rect
          x="321"
          y="-140"
          width="795"
          height="40"
          transform="rotate(90 321 -140)"
          fill="var(--color-background)"
        />
      </g>
    </svg>
  );
}
