import { createOAuthService, GithubEnv } from "@/domain/github-integration/services/oauth.service";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext();
  const searchParams = req.nextUrl.searchParams;

  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");
  const state = searchParams.get("state");

  if (!installationId || !setupAction || !state) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const service = createOAuthService(env as unknown as GithubEnv);
    const redirectUrl = await service.handleSetupCallback(state, installationId, setupAction);

    return NextResponse.redirect(redirectUrl);
  } catch (error: unknown) {
    console.error("github setup error:", error);
    // TODO: better error handling or redirect to an error page
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
