import { PlatformError } from "./errors";
import { apiError } from "./api-response";

export function withErrorHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      // 우리가 정의한 HTTP 목적별 에러인 경우
      if (error instanceof PlatformError) {
        return apiError(error.code, error.details);
      }

      // 예상치 못한 시스템 에러 (DB 연결 실패 등)
      console.error("[Unhandled Error]", error);
      return apiError("INTERNAL_ERROR");
    }
  };
}
