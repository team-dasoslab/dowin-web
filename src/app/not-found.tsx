import { detectLocale } from "@/i18n/detect-locale";
import { NotFoundPage } from "@/components/NotFoundPage";
import { headers } from "next/headers";

export default async function NotFound() {
  const headerList = await headers();
  const locale = detectLocale({
    customLocale: headerList.get("x-dowin-locale"),
    acceptLanguage: headerList.get("accept-language"),
  });

  return <NotFoundPage locale={locale} homeHref={`/${locale}`} />;
}
