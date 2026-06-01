import { redirect } from "next/navigation";
import { detectLocale } from "@/i18n/detect-locale";

export default async function WorkspaceCheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkout_id?: string;
    locale?: string;
    workspace_checkout_id?: string;
  }>;
}) {
  const params = await searchParams;
  const locale = detectLocale({ customLocale: params.locale });
  const target = new URLSearchParams();

  if (params.checkout_id) {
    target.set("checkout_id", params.checkout_id);
  }

  if (params.workspace_checkout_id) {
    target.set("workspace_checkout_id", params.workspace_checkout_id);
  }

  redirect(
    `/${locale}/workspace/new/complete${target.toString() ? `?${target.toString()}` : ""}`,
  );
}
