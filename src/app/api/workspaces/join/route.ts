import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceJoinSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { cookies } from "next/headers";

export const POST = withErrorHandler(async (request: Request, { env, db }) => {
  const storage = new WorkspaceStorage(db);
  const service = new WorkspaceService(storage);

  const session = await getSessionWithRefresh(db);
  if (!session) {
    return await apiError("UNAUTHORIZED");
  }

  const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
    db,
    userId: session.userId,
    env,
    intent: "general-write",
  });
  if (restrictedWriteResponse) {
    return restrictedWriteResponse;
  }

  const body = await request.json();
  const parsed = workspaceJoinSchema.safeParse(body);

  if (!parsed.success) {
    return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const resolvedWorkspaceId = await service.resolveWorkspaceIdByUid(parsed.data.workspaceId);
  if (!resolvedWorkspaceId) {
    return await apiError("NOT_FOUND", {
      detail: "워크스페이스를 찾을 수 없습니다.",
    });
  }

  await service.joinWorkspace(resolvedWorkspaceId, session.userId);
  const cookieStore = await cookies();
  cookieStore.set("dowin_workspace_id", parsed.data.workspaceId, {
    path: "/",
    maxAge: 31536000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return apiSuccess({ message: "워크스페이스에 참가했습니다." });
});
