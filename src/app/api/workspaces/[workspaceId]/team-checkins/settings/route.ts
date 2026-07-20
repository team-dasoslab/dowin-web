import { teamCheckinSettingsSchema } from "@/domain/team-checkin/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { TeamCheckinService } from "@/domain/team-checkin/services/team-checkin.service";
import { TeamCheckinStorage } from "@/domain/team-checkin/storage/team-checkin.storage";

export const GET = withWorkspaceAccess(
  async (_request, { context, db }) => {
    const service = new TeamCheckinService(new TeamCheckinStorage(db));
    return apiSuccess(await service.getSettings(context));
  },
);

export const PUT = withWorkspaceAccess(
  async (request, { context, db }) => {
    const parsed = teamCheckinSettingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new TeamCheckinService(new TeamCheckinStorage(db));
    return apiSuccess(
      await service.updateSettings(context, parsed.data),
    );
  },
);
