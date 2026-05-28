import SignupCompletePageClient from "./SignupCompletePageClient";

export default async function SignupCompletePage({
  searchParams,
}: {
  searchParams: Promise<{
    signup_intent_id?: string;
    checkout_id?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <SignupCompletePageClient
      signupIntentId={params.signup_intent_id ?? ""}
      checkoutId={params.checkout_id ?? ""}
    />
  );
}
