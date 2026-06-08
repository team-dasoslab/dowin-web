import AdminInquiryDetailClient from "./_components/AdminInquiryDetailClient";

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminInquiryDetailClient inquiryId={Number(id)} />;
}
