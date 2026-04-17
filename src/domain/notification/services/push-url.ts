import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type Locale,
} from "@/i18n/detect-locale";

export function getLocalizedDashboardPath(locale?: string | null): `/${Locale}/dashboard/my` {
  const resolvedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  return `/${resolvedLocale}/dashboard/my`;
}
