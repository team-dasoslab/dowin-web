"use client";

import { SignatureLoader, type SignatureLoaderVariant } from "@/components/SignatureLoader";

type InlineSpinnerProps = {
  className?: string;
  size?: "sm" | "md";
  variant?: SignatureLoaderVariant;
};

export function InlineSpinner({
  className = "",
  size = "md",
  variant = "ios",
}: InlineSpinnerProps) {
  return <SignatureLoader size={size} variant={variant} className={className} />;
}
