import { headers } from "next/headers";

export type Locale = "ko" | "en";

export const DEFAULT_LOCALE: Locale = "ko";
export const SUPPORTED_LOCALES: Locale[] = ["ko", "en"];

/**
 * 전역적인 로케일 설정을 가져오는 헬퍼 (Server Components / Route Handlers 전용)
 * 1. X-WIG-Locale 커스텀 헤더 (프론트엔드에서 수동 지정 시)
 * 2. Accept-Language 헤더 기반 감지
 * 3. 기본값 'ko'
 */
export async function getLocale(): Promise<Locale> {
  const headerList = await headers();

  // 1. 커스텀 헤더 확인
  const customLocale = headerList.get("x-wig-locale") as Locale | null;
  if (customLocale && SUPPORTED_LOCALES.includes(customLocale)) {
    return customLocale;
  }

  // 2. Accept-Language 확인
  const acceptLanguage = headerList.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.startsWith("en")) return "en";
    if (acceptLanguage.startsWith("ko")) return "ko";
  }

  return DEFAULT_LOCALE;
}
