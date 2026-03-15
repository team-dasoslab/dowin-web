import { NextResponse } from "next/server";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "INVALID_CREDENTIALS"
  | "SESSION_EXPIRED"
  | "WRONG_PASSWORD"
  | "INVALID_INVITE_CODE"
  | "EXPIRED_INVITE_CODE"
  | "ALREADY_IN_WORKSPACE"
  | "CANNOT_REMOVE_LAST_ADMIN"
  | "ACTIVE_SCOREBOARD_EXISTS"
  | "SCOREBOARD_ALREADY_ACTIVE"
  | "SCOREBOARD_ARCHIVED"
  | "LEAD_MEASURE_ARCHIVED"
  | "FUTURE_DATE_NOT_ALLOWED";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "해당 리소스에 접근할 권한이 없습니다.",
  NOT_FOUND: "요청한 리소스를 찾을 수 없습니다.",
  VALIDATION_ERROR: "입력값이 올바르지 않습니다.",
  INTERNAL_ERROR: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  INVALID_CREDENTIALS: "아이디 또는 비밀번호가 올바르지 않습니다.",
  SESSION_EXPIRED: "세션이 만료되었습니다. 다시 로그인해주세요.",
  WRONG_PASSWORD: "현재 비밀번호가 올바르지 않습니다.",
  INVALID_INVITE_CODE: "존재하지 않는 초대 코드입니다.",
  EXPIRED_INVITE_CODE: "초대 코드가 만료되었습니다. 관리자에게 새 코드를 요청하세요.",
  ALREADY_IN_WORKSPACE: "이미 워크스페이스에 소속되어 있습니다.",
  CANNOT_REMOVE_LAST_ADMIN: "마지막 관리자는 퇴출할 수 없습니다.",
  ACTIVE_SCOREBOARD_EXISTS: "이미 활성화된 점수판이 있습니다.",
  SCOREBOARD_ALREADY_ACTIVE: "이미 활성화된 점수판입니다.",
  SCOREBOARD_ARCHIVED: "보관된 점수판은 수정할 수 없습니다.",
  LEAD_MEASURE_ARCHIVED: "보관된 선행지표에는 기록을 추가할 수 없습니다.",
  FUTURE_DATE_NOT_ALLOWED: "미래 날짜에는 기록할 수 없습니다.",
};

const ERROR_STATUS: Partial<Record<ErrorCode, number>> = {
  UNAUTHORIZED: 401,
  SESSION_EXPIRED: 401,
  INVALID_CREDENTIALS: 401,
  WRONG_PASSWORD: 400,
  FUTURE_DATE_NOT_ALLOWED: 400,
  SCOREBOARD_ALREADY_ACTIVE: 400,
  FORBIDDEN: 403,
  CANNOT_REMOVE_LAST_ADMIN: 403,
  SCOREBOARD_ARCHIVED: 403,
  LEAD_MEASURE_ARCHIVED: 403,
  NOT_FOUND: 404,
  INVALID_INVITE_CODE: 404,
  EXPIRED_INVITE_CODE: 410,
  ALREADY_IN_WORKSPACE: 409,
  ACTIVE_SCOREBOARD_EXISTS: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
};

export const apiError = (code: ErrorCode, details?: unknown) => {
  const status = ERROR_STATUS[code] ?? 400;
  return NextResponse.json(
    {
      error: {
        code,
        message: ERROR_MESSAGES[code],
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
};

export const apiSuccess = <T>(data: T, status = 200) =>
  NextResponse.json(data, { status });
