import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAdmin } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAdmin<{ workspaceId: string }>(
  async (_request, { context, db }) => {
    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

    const members = await service.getMembers(context);
    return apiSuccess(members);
  },
);
