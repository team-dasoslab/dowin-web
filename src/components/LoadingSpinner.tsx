"use client";

import { LoadingOverlay } from "@/components/LoadingOverlay";

type LoadingSpinnerProps = {
  message?: string;
};

export function LoadingSpinner({
  message = "잠시만 기다려주세요.",
}: LoadingSpinnerProps) {
  return <LoadingOverlay message={message} />;
}
