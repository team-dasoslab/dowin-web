import { teamCheckinResponseSchema } from "@/domain/team-checkin/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { TeamCheckinService } from "@/domain/team-checkin/services/team-checkin.service";
import { TeamCheckinStorage } from "@/domain/team-checkin/storage/team-checkin.storage";

export const POST = withWorkspaceAccess<{ workspaceId: string; checkinId: string }>(
  async (request, { context, db, params }) => {
    const parsed = teamCheckinResponseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new TeamCheckinService(new TeamCheckinStorage(db));
    return apiSuccess(
      await service.respondToCheckin(
        context,
        params.checkinId,
        parsed.data,
      ),
    );
  },
);
