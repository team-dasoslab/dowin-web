import { apiSuccess } from "@/lib/server/api-response";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getTeamCheckinRouteContext } from "../../../_utils";

export const POST = withErrorHandler(
  async (
    _request: Request,
    { params }: { params: Promise<{ workspaceId: string; proposalId: string }> },
  ) => {
    const { workspaceId, proposalId } = await params;
    const routeContext = await getTeamCheckinRouteContext(workspaceId);
    if (!routeContext.ok) return routeContext.error;

    return apiSuccess(
      await routeContext.service.acceptProposal(routeContext.context, proposalId),
    );
  },
);
