import { runWeeklyFocusReminder } from "@/domain/notification/services/run-weekly-focus-reminder";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const { env } = getCloudflareContext();

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklyFocusReminder(env);

  return NextResponse.json(result);
}
