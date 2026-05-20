import { resolveLocale, type Locale } from "@/i18n/detect-locale";
import { cookies, headers } from "next/headers";
export type { Locale } from "@/i18n/detect-locale";

const MISSING_REQUEST_SCOPE_MESSAGE = "outside a request scope";

/**
 * 전역적인 로케일 설정을 가져오는 헬퍼 (Server Components / Route Handlers 전용)
 * 1. X-Dowin-Locale 커스텀 헤더 (프론트엔드에서 수동 지정 시)
 * 2. NEXT_LOCALE 쿠키
 * 3. Accept-Language 헤더 기반 감지
 * 4. 기본값 'ko'
 */
export async function getLocale(): Promise<Locale> {
  const headerList = await safeHeaders();
  const cookieStore = await safeCookies();

  return resolveLocale({
    customLocale: headerList?.get("x-dowin-locale"),
    cookieLocale: cookieStore?.get("NEXT_LOCALE")?.value,
    acceptLanguage: headerList?.get("accept-language"),
  });
}

async function safeHeaders() {
  try {
    return await headers();
  } catch (error) {
    if (isMissingRequestScopeError(error)) {
      return null;
    }

    throw error;
  }
}

async function safeCookies() {
  try {
    return await cookies();
  } catch (error) {
    if (isMissingRequestScopeError(error)) {
      return null;
    }

    throw error;
  }
}

function isMissingRequestScopeError(error: unknown) {
  return error instanceof Error && error.message.includes(MISSING_REQUEST_SCOPE_MESSAGE);
}
