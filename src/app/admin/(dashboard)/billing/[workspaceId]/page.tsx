import AdminBillingDetailClient from "./_components/AdminBillingDetailClient";

export default async function AdminBillingDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <AdminBillingDetailClient workspaceId={Number(workspaceId)} />;
}
