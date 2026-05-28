import { apiError } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";

export const POST = withErrorHandler(async (request: Request) => {
  await request.json().catch(() => null);
  return apiError("SIGNUP_PAYMENT_REQUIRED");
});
