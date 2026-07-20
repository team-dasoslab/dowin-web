import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { cookies } from "next/headers";

export const GET = withErrorHandler(async (_, { db }) => {
  const storage = new WorkspaceStorage(db);
  const service = new WorkspaceService(storage);

  const session = await getSessionWithRefresh(db);
  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const cookieStore = await cookies();
  const currentWorkspaceUid = cookieStore.get("dowin_workspace_id")?.value;

  const workspace = await service.getMyWorkspace(session.userId, currentWorkspaceUid);
  return apiSuccess(workspace);
});
