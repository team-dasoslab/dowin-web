import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceCurrentUpdateSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { cookies } from "next/headers";

export const PUT = withErrorHandler(async (request: Request, { db }) => {
  const storage = new WorkspaceStorage(db);
  const service = new WorkspaceService(storage);

  const session = await getSessionWithRefresh(db);
  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const body = await request.json();
  const parsed = workspaceCurrentUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const workspaceId = parsed.data.workspaceId;

  // Verify the user is a member of the requested workspace
  const internalId = await storage.resolveIdByUid(workspaceId);
  if (!internalId) {
    return await apiError("NOT_FOUND", "존재하지 않는 워크스페이스입니다.");
  }

  const membership = await storage.findMembership(internalId, session.userId);
  if (!membership) {
    return await apiError("FORBIDDEN", "해당 워크스페이스에 대한 접근 권한이 없습니다.");
  }

  // Set the cookie
  const cookieStore = await cookies();
  cookieStore.set("dowin_workspace_id", workspaceId, {
    path: "/",
    maxAge: 31536000, // 1 year
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Return the workspace list item format as defined in OpenAPI
  const workspaces = await service.listMyWorkspaces(session.userId, internalId);
  const selectedWorkspace = workspaces.find((w) => w.id === workspaceId);

  if (!selectedWorkspace) {
    return await apiError("NOT_FOUND", "워크스페이스를 찾을 수 없습니다.");
  }

  return apiSuccess(selectedWorkspace);
});
