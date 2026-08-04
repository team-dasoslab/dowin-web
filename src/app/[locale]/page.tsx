import { RootLandingPage } from "@/app/_components/RootLandingPage";
import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { getDb } from "@/db";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { redirectToDefaultWorkspace } from "@/lib/server/workspace-redirect";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const origin = serverRuntimeConfig.appOrigin;
  const title = t("home.title");
  const description = t("home.description");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { ko: "/ko", en: "/en" },
    },
    openGraph: {
      title,
      description,
      url: `${origin}/${locale}`,
      locale: locale === "ko" ? "ko_KR" : "en_US",
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (session) {
    await redirectToDefaultWorkspace(session.userId, locale);
  }

  const userAgent = (await headers()).get("user-agent") || "";
  const isApp = userAgent.includes("DowinApp");

  if (isApp) {
    redirect({ href: "/login", locale: locale });
  }

  return <RootLandingPage origin={serverRuntimeConfig.appOrigin} />;
}
