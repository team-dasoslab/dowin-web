import { headers } from "next/headers";
import { detectLocale, type Locale } from "@/i18n/detect-locale";
export type { Locale } from "@/i18n/detect-locale";

/**
 * 전역적인 로케일 설정을 가져오는 헬퍼 (Server Components / Route Handlers 전용)
 * 1. X-WIG-Locale 커스텀 헤더 (프론트엔드에서 수동 지정 시)
 * 2. Accept-Language 헤더 기반 감지
 * 3. 기본값 'en'
 */
export async function getLocale(): Promise<Locale> {
  const headerList = await headers();
  return detectLocale({
    customLocale: headerList.get("x-wig-locale"),
    acceptLanguage: headerList.get("accept-language"),
  });
}
