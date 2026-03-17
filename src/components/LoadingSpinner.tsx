"use client";

import {
  LoadingOverlay,
} from "@/components/LoadingOverlay";
import type { SignatureLoaderVariant } from "@/components/SignatureLoader";

type LoadingSpinnerProps = {
  message?: string;
  variant?: SignatureLoaderVariant;
};

export function LoadingSpinner({
  message = "잠시만 기다려주세요.",
  variant = "ios",
}: LoadingSpinnerProps) {
  return <LoadingOverlay message={message} variant={variant} />;
}
