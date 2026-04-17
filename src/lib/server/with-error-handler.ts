import { PlatformError } from "@/lib/server/errors";
import { apiError } from "@/lib/server/api-response";
import type { NextResponse } from "next/server";

type AsyncHandler<TArgs extends unknown[] = unknown[]> = (
  ...args: TArgs
) => Promise<NextResponse | Response>;

export function withErrorHandler<TArgs extends unknown[]>(
  handler: AsyncHandler<TArgs>,
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof PlatformError) {
        return await apiError(error.code, error.details);
      }

      console.error("[Unhandled Error]", error);
      return await apiError("INTERNAL_ERROR");
    }
  };
}
