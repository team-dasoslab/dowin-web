import type { getWorkspacesWorkspaceIdDashboardTeamResponse } from "@/api/generated/dashboard/dashboard";
import type { getUsersMeResponse } from "@/api/generated/profile/profile";
import { getDb } from "@/db";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { DashboardService } from "@/domain/dashboard/services/dashboard.service";
import { ActionItemMetadataStorage } from "@/domain/dashboard/storage/action-item-metadata.storage";
import { ProfileService } from "@/domain/profile/services/profile.service";
import { ProfileStorage } from "@/domain/profile/storage/profile.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { getSession } from "@/lib/server/auth";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { DashboardTeamClient } from "./_components/DashboardTeamClient";
import { getTodayInKst, getWeekDates } from "./my/_lib/week";


export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session) {
    return null;
  }

  const today = getTodayInKst();
  const weekDates = getWeekDates(today);
  const selectedWeekStart = weekDates[0] ?? today;

  const profileService = new ProfileService(new ProfileStorage(db));
  const initialProfile = await profileService.getMyProfile(session.userId);

  const workspaceStorage = new WorkspaceStorage(db);
  const activeWorkspaceId = await workspaceStorage.resolveIdByUid(workspaceId);

  let initialTeamDashboard;
  if (activeWorkspaceId) {
    try {
      const context = await requireWorkspaceAccess(
        workspaceStorage,
        activeWorkspaceId,
        session.userId,
      );

      const dashboardService = new DashboardService(
        workspaceStorage,
        new ScoreboardStorage(db),
        new DailyLogStorage(db),
        new ActionItemMetadataStorage(db),
      );

      initialTeamDashboard = await dashboardService.getTeamDashboard(
        context,
        selectedWeekStart,
      );
    } catch {}
  }

  const initialProfileResponse = {
    data: initialProfile,
    status: 200,
  } as unknown as getUsersMeResponse;

  const initialDashboardResponse = initialTeamDashboard
    ? ({
        data: initialTeamDashboard,
        status: 200,
      } as unknown as getWorkspacesWorkspaceIdDashboardTeamResponse)
    : undefined;

  return (
    <DashboardTeamClient
      initialProfile={initialProfileResponse}
      initialTeamDashboard={initialDashboardResponse}
    />
  );
}
