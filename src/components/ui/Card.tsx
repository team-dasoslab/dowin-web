import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

export const Card = ({ className, ref, ...props }: CardProps) => {
  return (
    <div
      className={className}
      ref={ref}
      {...props}
    />
  );
};

Card.displayName = "Card";
