import { DashboardService } from "@/domain/dashboard/services/dashboard.service";
import { dashboardTeamQuerySchema } from "@/domain/dashboard/validation";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess(
  async (request, { context, db, workspaceStorage }) => {
    const query = dashboardTeamQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    if (!query.success) {
      return await apiError("VALIDATION_ERROR", query.error.flatten().fieldErrors);
    }

    const service = new DashboardService(
      workspaceStorage,
      new ScoreboardStorage(db),
      new DailyLogStorage(db),
    );
    const result = await service.getTeamDashboard(
      context,
      query.data.weekStart,
    );

    return apiSuccess(result);
  }
);
