import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAccess<{ workspaceId: string }>(
  async (_request, { context, db }) => {
    if (context.role !== "ADMIN") {
      return await apiError("FORBIDDEN", { detail: "Workspace admin role required." });
    }

    const storage = new WorkspaceStorage(db);
    const service = new WorkspaceService(storage);

    const members = await service.getMembers(context);
    return apiSuccess(members);
  },
);
