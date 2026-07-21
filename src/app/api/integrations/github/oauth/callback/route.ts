import { createOAuthService } from "@/domain/github-integration/services/oauth.service";
import { apiError } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { NextResponse } from "next/server";

export const GET = withErrorHandler(async (req, { env }) => {
  const searchParams = req.nextUrl.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    const errorDescription = searchParams.get("error_description");
    console.error("github oauth error:", error, errorDescription);
    return apiError("VALIDATION_ERROR", errorDescription || error);
  }

  if (!code || !state) {
    return apiError("VALIDATION_ERROR", "Missing required parameters");
  }

  const service = createOAuthService(env);
  const result = await service.handleOAuthCallback(code, state);

  const baseUrl = env.APP_BASE_URL || req.nextUrl.origin;
  const redirectPath = result.workspaceId
    ? `/${result.locale}/${result.workspaceId}/settings/integrations/github?status=connected`
    : `/${result.locale}/profile?status=connected`;

  const redirectUrl = new URL(redirectPath, baseUrl);

  return NextResponse.redirect(redirectUrl);
});
