import { runTeamCheckin } from "@/domain/team-checkin/services/run-team-checkin";
import { teamCheckinRunSchema } from "@/domain/team-checkin/validation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const { env } = getCloudflareContext();

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = teamCheckinRunSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 },
    );
  }

  const result = await runTeamCheckin(env, parsed.data);

  return NextResponse.json(result);
}
