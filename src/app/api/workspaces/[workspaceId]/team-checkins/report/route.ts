import { teamCheckinReportQuerySchema } from "@/domain/team-checkin/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getTeamCheckinRouteContext } from "../_utils";

export const GET = withErrorHandler(
  async (request: Request, { params }: { params: Promise<{ workspaceId: string }> }) => {
    const { workspaceId } = await params;
    const routeContext = await getTeamCheckinRouteContext(workspaceId);
    if (!routeContext.ok) return routeContext.error;

    const parsed = teamCheckinReportQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    return apiSuccess(
      await routeContext.service.getReport(
        routeContext.context,
        parsed.data.weekStart,
      ),
    );
  },
);
