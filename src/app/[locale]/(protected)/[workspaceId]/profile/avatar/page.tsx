import { redirect } from "@/i18n/routing";

export default async function WorkspaceProfileAvatarPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceId: string }>;
}) {
  const { locale, workspaceId } = await params;
  redirect({ href: `/${workspaceId}/profile`, locale });
}
