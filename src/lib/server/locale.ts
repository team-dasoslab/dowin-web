import { resolveLocale, type Locale } from "@/i18n/detect-locale";
import { cookies, headers } from "next/headers";
export type { Locale } from "@/i18n/detect-locale";

/**
 * 전역적인 로케일 설정을 가져오는 헬퍼 (Server Components / Route Handlers 전용)
 * 1. X-DOWIN-Locale 커스텀 헤더 (프론트엔드에서 수동 지정 시)
 * 2. NEXT_LOCALE 쿠키
 * 3. Accept-Language 헤더 기반 감지
 * 4. 기본값 'ko'
 */
export async function getLocale(): Promise<Locale> {
  const headerList = await headers();
  const cookieStore = await cookies();

  return resolveLocale({
    customLocale: headerList.get("x-dowin-locale"),
    cookieLocale: cookieStore.get("NEXT_LOCALE")?.value,
    acceptLanguage: headerList.get("accept-language"),
  });
}
