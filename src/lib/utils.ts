import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).substring(2, 11) +
    Math.random().toString(36).substring(2, 11)
  );
}

export function generatePromotionCode(prefix = "DOWIN") {
  return `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
