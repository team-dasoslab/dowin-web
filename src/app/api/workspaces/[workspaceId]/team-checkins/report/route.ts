import { teamCheckinReportQuerySchema } from "@/domain/team-checkin/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { TeamCheckinService } from "@/domain/team-checkin/services/team-checkin.service";
import { TeamCheckinStorage } from "@/domain/team-checkin/storage/team-checkin.storage";

export const GET = withWorkspaceAccess(
  async (request, { context, db }) => {
    const parsed = teamCheckinReportQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new TeamCheckinService(new TeamCheckinStorage(db));
    return apiSuccess(
      await service.getReport(
        context,
        parsed.data.weekStart,
        parsed.data.activeOnly
      ),
    );
  },
);
