import { resolveLocale } from "@/i18n/detect-locale";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Root page redirect to default locale or detected locale.
 * Usually handled by middleware, but this acts as a fallback or explicit entry point.
 */
export default async function RootPage() {
  // If the request reaches here, it means the middleware didn't redirect.
  // Keep the fallback aligned with the main locale resolution logic.
  const headerList = await headers();
  const cookieStore = await cookies();
  const locale = resolveLocale({
    customLocale: headerList.get("x-dowin-locale"),
    cookieLocale: cookieStore.get("NEXT_LOCALE")?.value,
    acceptLanguage: headerList.get("accept-language"),
  });

  redirect(`/${locale}`);
}
