import { getDb } from "@/db";
import { getAdminSession } from "@/lib/server/admin-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import AdminSidebarClient from "./_components/AdminSidebarClient";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getAdminSession(db);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px] opacity-40"></div>
      <AdminSidebarClient />
      <main className="flex-1 flex flex-col min-h-screen h-screen overflow-y-auto p-4 md:p-6">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
