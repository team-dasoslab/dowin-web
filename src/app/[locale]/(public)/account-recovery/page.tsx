import AccountRecoveryPageClient from "@/app/_components/AccountRecoveryPageClient";
import { getDb } from "@/db";
import { getSession } from "@/lib/server/auth";
import { redirectToDefaultWorkspace } from "@/lib/server/workspace-redirect";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("accountRecovery.title"),
    description: t("accountRecovery.description"),
    alternates: { canonical: `/${locale}/account-recovery` },
    robots: { index: false, follow: true },
  };
}

export default async function AccountRecoveryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (session) {
    await redirectToDefaultWorkspace(session.userId, locale);
  }

  return <AccountRecoveryPageClient />;
}
