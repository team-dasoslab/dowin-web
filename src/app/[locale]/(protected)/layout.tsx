import { getDb } from "@/db";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { LocaleEnforcer } from "./_components/LocaleEnforcer";
import { MainContentWrapper } from "./_components/MainContentWrapper";
import { ProtectedContentLayout } from "./_components/ProtectedContentLayout";
import { Sidebar } from "./_components/Sidebar";

export default async function ProtectedLayout({
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

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-50/50">
      <LocaleEnforcer />
      <Sidebar />
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden md:pl-[80px] lg:pl-[240px]"
      >
        <MainContentWrapper>
          <ProtectedContentLayout>{children}</ProtectedContentLayout>
        </MainContentWrapper>
      </main>
    </div>
  );
}
