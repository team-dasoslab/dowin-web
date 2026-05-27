import { detectLocale } from "@/i18n/detect-locale";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SignupCheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    locale?: string;
    signup_intent_id?: string;
    checkout_id?: string;
  }>;
}) {
  const params = await searchParams;
  const headerList = await headers();
  const locale = detectLocale({
    customLocale: params.locale,
    acceptLanguage: headerList.get("accept-language"),
  });
  const query = new URLSearchParams();

  if (params.signup_intent_id) {
    query.set("signup_intent_id", params.signup_intent_id);
  }

  if (params.checkout_id) {
    query.set("checkout_id", params.checkout_id);
  }

  redirect(`/${locale}/signup/complete${query.toString() ? `?${query}` : ""}`);
}
