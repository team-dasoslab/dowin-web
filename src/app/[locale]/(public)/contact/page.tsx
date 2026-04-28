import { getDb } from "@/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/server/auth";
import type { Locale } from "@/i18n/detect-locale";
import { setRequestLocale } from "next-intl/server";
import { ContactConsentPage } from "./ContactConsentPage";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  return <ContactConsentPage isAuthenticated={Boolean(session)} />;
}
