import { redirect } from "next/navigation";

/**
 * Root page redirect to default locale or detected locale.
 * Usually handled by middleware, but this acts as a fallback or explicit entry point.
 */
export default function RootPage() {
  // If the request reaches here, it means the middleware didn't redirect.
  // We'll redirect to the default locale.
  redirect("/en");
}
