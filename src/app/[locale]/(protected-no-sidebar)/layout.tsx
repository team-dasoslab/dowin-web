import { getDb } from "@/db";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export default async function ProtectedNoSidebarLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session) {
    return redirect({ href: "/login", locale });
  }

  return <>{children}</>;
}
