import { getPolarBillingCallbackPath } from "@/domain/billing/polar-callback";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PolarBillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    locale?: string;
    billing?: string;
    checkout_id?: string;
    return_path?: string;
  }>;
}) {
  const params = await searchParams;
  const headerList = await headers();

  redirect(
    getPolarBillingCallbackPath({
      locale: params.locale,
      acceptLanguage: headerList.get("accept-language"),
      billing: params.billing,
      checkoutId: params.checkout_id,
      returnPath: params.return_path,
    }),
  );
}
