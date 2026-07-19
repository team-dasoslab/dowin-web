import { createOAuthService, GithubEnv } from "@/domain/github-integration/services/oauth.service";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext();
  const searchParams = req.nextUrl.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    const errorDescription = searchParams.get("error_description");
    console.error("github oauth error:", error, errorDescription);
    return NextResponse.json({ error: errorDescription || error }, { status: 400 });
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const service = createOAuthService(env as unknown as GithubEnv);
    const result = await service.handleOAuthCallback(code, state);

    // Redirect back to Dowin workspace settings
    const baseUrl = env.APP_BASE_URL || req.nextUrl.origin;
    const redirectUrl = new URL(
      `/${result.locale}/${result.workspaceId}/settings/integrations/github`,
      baseUrl,
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error: unknown) {
    console.error("github oauth callback error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
