import { detectLocale } from "@/i18n/detect-locale";

export function getPolarBillingCallbackPath({
  locale,
  acceptLanguage,
  billing,
  checkoutId,
  returnPath,
}: {
  locale?: string | null;
  acceptLanguage?: string | null;
  billing?: string | null;
  checkoutId?: string | null;
  returnPath?: string | null;
}) {
  const resolvedLocale = detectLocale({
    customLocale: locale,
    acceptLanguage,
  });
  const searchParams = new URLSearchParams();
  const targetPath = getSafeReturnPath(returnPath) ?? `/${resolvedLocale}/workspace/billing`;

  if (billing === "success") {
    searchParams.set("billing", "success");
  }

  if (checkoutId) {
    searchParams.set("checkout_id", checkoutId);
  }

  const query = searchParams.toString();
  return `${targetPath}${query ? `${targetPath.includes("?") ? "&" : "?"}${query}` : ""}`;
}

function getSafeReturnPath(returnPath?: string | null) {
  if (!returnPath || !returnPath.startsWith("/") || returnPath.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(returnPath, "https://return-path.invalid");
    if (url.origin !== "https://return-path.invalid") {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
