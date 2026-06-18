import { teamCheckinResponseSchema } from "@/domain/team-checkin/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getTeamCheckinRouteContext } from "../../_utils";

export const POST = withErrorHandler(
  async (
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; checkinId: string }> },
  ) => {
    const { workspaceId, checkinId } = await params;
    const routeContext = await getTeamCheckinRouteContext(workspaceId);
    if (!routeContext.ok) return routeContext.error;

    const parsed = teamCheckinResponseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    return apiSuccess(
      await routeContext.service.respondToCheckin(
        routeContext.context,
        checkinId,
        parsed.data,
      ),
    );
  },
);
