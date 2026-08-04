import LoginPageClient from "@/app/_components/LoginPageClient";
import { getDb } from "@/db";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirectToDefaultWorkspace } from "@/lib/server/workspace-redirect";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("login.title"),
    description: t("login.description"),
    alternates: { canonical: `/${locale}/login` },
    robots: { index: false, follow: true },
  };
}

export default async function LoginPage({
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

  return <LoginPageClient />;
}
