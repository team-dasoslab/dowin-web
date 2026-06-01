import WorkspaceCheckoutCompletePageClient from "@/app/[locale]/(protected)/workspace/new/complete/WorkspaceCheckoutCompletePageClient";

export default async function WorkspaceCheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{
    checkout_id?: string;
    workspace_checkout_id?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <WorkspaceCheckoutCompletePageClient
      checkoutId={params.checkout_id ?? ""}
      workspaceCheckoutId={params.workspace_checkout_id ?? ""}
    />
  );
}
