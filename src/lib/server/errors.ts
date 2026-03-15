import { ErrorCode } from "@/lib/server/api-response";

// 공통 부모 에러 클래스
export abstract class PlatformError extends Error {
  public abstract readonly statusCode: number;

  constructor(
    public readonly code: ErrorCode,
    public readonly details?: unknown,
  ) {
    super(code);
    this.name = this.constructor.name;
  }
}

// 400 Bad Request
export class BadRequestError extends PlatformError {
  public readonly statusCode = 400;
}

// 401 Unauthorized
export class UnauthorizedError extends PlatformError {
  public readonly statusCode = 401;
}

// 403 Forbidden
export class ForbiddenError extends PlatformError {
  public readonly statusCode = 403;
}

// 404 Not Found
export class NotFoundError extends PlatformError {
  public readonly statusCode = 404;
}

// 409 Conflict (비즈니스 상태 충돌)
export class ConflictError extends PlatformError {
  public readonly statusCode = 409;
}

// 422 Unprocessable Entity (유효성 검사 등)
export class ValidationError extends PlatformError {
  public readonly statusCode = 422;
}
