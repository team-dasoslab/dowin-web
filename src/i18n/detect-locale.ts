export type Locale = "ko" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["ko", "en"];
export const DEFAULT_LOCALE: Locale = "ko";

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return value === "ko" || value === "en";
}

export function detectLocale({
  customLocale,
  acceptLanguage,
}: {
  customLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isSupportedLocale(customLocale)) {
    return customLocale;
  }

  const normalizedAcceptLanguage = acceptLanguage?.toLowerCase();
 
  if (normalizedAcceptLanguage?.startsWith("ko")) {
    return "ko";
  }
 
  if (normalizedAcceptLanguage?.startsWith("en")) {
    return "en";
  }
 
  return DEFAULT_LOCALE;
}
