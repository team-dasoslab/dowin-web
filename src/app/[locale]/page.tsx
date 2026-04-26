import { RootLandingPage } from "@/app/_components/RootLandingPage";
import { getDb } from "@/db";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

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
    redirect({ href: "/dashboard/my", locale: locale });
  }

  const userAgent = (await headers()).get("user-agent") || "";
  const isApp = userAgent.includes("DowinApp");

  if (isApp) {
    redirect({ href: "/login", locale: locale });
  }

  return <RootLandingPage />;
}
