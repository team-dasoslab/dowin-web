import { getDb } from "@/db";
import { getSession } from "@/lib/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "@/i18n/routing";
import { LocaleEnforcer } from "./_components/LocaleEnforcer";
import { ProtectedContentLayout } from "./_components/ProtectedContentLayout";
import { Sidebar } from "./_components/Sidebar";
import { scoreboards, workspaceMembers, workspaces } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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

  const memberInfo = await db
    .select({
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, session.userId))
    .get();

  const activeScoreboard = memberInfo
    ? await db
        .select({ id: scoreboards.id })
        .from(scoreboards)
        .where(
          and(
            eq(scoreboards.workspaceId, memberInfo.workspaceId),
            eq(scoreboards.userId, session.userId),
            eq(scoreboards.status, "ACTIVE"),
          ),
        )
        .get()
    : null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <LocaleEnforcer />
      <Sidebar
        workspaceName={memberInfo?.workspaceName}
        role={memberInfo?.role}
        hasScoreboard={Boolean(activeScoreboard)}
      />
      <main className="md:pl-[80px] lg:pl-[240px]">
        <div className="pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0">
          <ProtectedContentLayout>{children}</ProtectedContentLayout>
        </div>
      </main>
    </div>
  );
}
