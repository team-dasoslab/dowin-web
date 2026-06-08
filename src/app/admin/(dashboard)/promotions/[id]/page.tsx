import AdminPromotionDetailClient from "./_components/AdminPromotionDetailClient";

export default async function AdminPromotionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminPromotionDetailClient promotionId={Number(id)} />;
}
