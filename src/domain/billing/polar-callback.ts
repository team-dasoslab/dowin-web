import { detectLocale } from "@/i18n/detect-locale";

export function getPolarBillingCallbackPath({
  locale,
  acceptLanguage,
  billing,
  checkoutId,
}: {
  locale?: string | null;
  acceptLanguage?: string | null;
  billing?: string | null;
  checkoutId?: string | null;
}) {
  const resolvedLocale = detectLocale({
    customLocale: locale,
    acceptLanguage,
  });
  const searchParams = new URLSearchParams();

  if (billing === "success") {
    searchParams.set("billing", "success");
  }

  if (checkoutId) {
    searchParams.set("checkout_id", checkoutId);
  }

  const query = searchParams.toString();
  return `/${resolvedLocale}/profile/billing${query ? `?${query}` : ""}`;
}
