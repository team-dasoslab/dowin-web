import { DashboardService } from "@/domain/dashboard/services/dashboard.service";
import { dashboardMyQuerySchema } from "@/domain/dashboard/validation";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { ActionItemMetadataStorage } from "@/domain/dashboard/storage/action-item-metadata.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess(
  async (request, { context, db, workspaceStorage }) => {
    const query = dashboardMyQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    if (!query.success) {
      return await apiError("VALIDATION_ERROR", query.error.flatten().fieldErrors);
    }

    const service = new DashboardService(
      workspaceStorage,
      new ScoreboardStorage(db),
      new DailyLogStorage(db),
      new ActionItemMetadataStorage(db),
    );
    const result = await service.getMyDashboard(context, query.data);

    return apiSuccess(result);
  },
);
