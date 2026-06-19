import { getDb } from "@/db";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SidebarProvider } from "@/context/SidebarContext";
import { MainContentWrapper } from "./_components/MainContentWrapper";
import { ProtectedContentLayout } from "./_components/ProtectedContentLayout";
import { ProtectedLayoutShell } from "./_components/ProtectedLayoutShell";
import { Sidebar } from "./_components/Sidebar";
import { TimezoneSync } from "./_components/TimezoneSync";

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
    <SidebarProvider>
      <TimezoneSync />
      <ProtectedLayoutShell sidebar={<Sidebar />}>
        <MainContentWrapper>
          <ProtectedContentLayout>{children}</ProtectedContentLayout>
        </MainContentWrapper>
      </ProtectedLayoutShell>
    </SidebarProvider>
  );
}
