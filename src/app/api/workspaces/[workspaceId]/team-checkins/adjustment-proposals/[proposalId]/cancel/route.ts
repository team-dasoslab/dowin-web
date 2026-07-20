import { apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { TeamCheckinService } from "@/domain/team-checkin/services/team-checkin.service";
import { TeamCheckinStorage } from "@/domain/team-checkin/storage/team-checkin.storage";

export const POST = withWorkspaceAccess<{ workspaceId: string; proposalId: string }>(
  async (_request, { context, db, params }) => {
    const service = new TeamCheckinService(new TeamCheckinStorage(db));
    return apiSuccess(
      await service.cancelProposal(context, params.proposalId),
    );
  },
);
