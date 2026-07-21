import type { getWorkspacesWorkspaceIdDashboardMyResponse } from "@/api/generated/dashboard/dashboard";
import type { getUsersMeResponse } from "@/api/generated/profile/profile";
import { createDashboardService } from "@/domain/dashboard/dashboard.factory";
import { createProfileService } from "@/domain/profile/profile.factory";
import { createWorkspaceStorage } from "@/domain/workspace/workspace.factory";
import { requirePageContext } from "@/lib/server/page-context";
import { requireWorkspaceAccess } from "@/lib/server/workspace-context";
import { DashboardMyClient } from "./_components/DashboardMyClient";
import { isDashboardView } from "./_lib/dashboard-scoreboard";
import { getMonthStart, getTodayInKst, getWeekDates, isValidDateString } from "./_lib/week";


export default async function MyDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { workspaceId } = await params;
  const sp = await searchParams;

  const { db, session } = await requirePageContext();

  const today = getTodayInKst();
  const rawView = typeof sp.view === "string" ? sp.view : "";
  const selectedView = isDashboardView(rawView) ? rawView : "week";
  const rawDate = typeof sp.date === "string" && isValidDateString(sp.date) ? sp.date : today;

  const weekDates = getWeekDates(rawDate);
  const selectedWeekStart = weekDates[0] ?? today;
  const selectedMonthStart = getMonthStart(rawDate);

  const profileService = createProfileService(db);
  const initialProfile = await profileService.getMyProfile(session.userId);

  const workspaceStorage = createWorkspaceStorage(db);
  const activeWorkspaceId = await workspaceStorage.resolveIdByUid(workspaceId);

  let initialDashboard;
  if (activeWorkspaceId) {
    try {
      const context = await requireWorkspaceAccess(
        workspaceStorage,
        activeWorkspaceId,
        session.userId,
      );

      const dashboardService = createDashboardService(db);

      initialDashboard = await dashboardService.getMyDashboard(context, {
        view: selectedView,
        monthStart: selectedMonthStart,
        weekStart: selectedWeekStart,
      });
    } catch {}
  }

  const initialProfileResponse = {
    data: initialProfile,
    status: 200,
  } as unknown as getUsersMeResponse;

  const initialDashboardResponse = initialDashboard
    ? ({
        data: initialDashboard,
        status: 200,
      } as unknown as getWorkspacesWorkspaceIdDashboardMyResponse)
    : undefined;

  return (
    <DashboardMyClient
      initialProfile={initialProfileResponse}
      initialDashboard={initialDashboardResponse}
    />
  );
}
