import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  ref?: React.Ref<HTMLSpanElement>;
}

export const Badge = ({ className, ref, ...props }: BadgeProps) => {
  return (
    <span
      className={className}
      ref={ref}
      {...props}
    />
  );
};

Badge.displayName = "Badge";
