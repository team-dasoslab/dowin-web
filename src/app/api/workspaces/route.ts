import { getDb } from "@/db";
import { WorkspaceService } from "@/domain/workspace/services/workspace.service";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { workspaceCreateSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getSession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const storage = new WorkspaceStorage(db);
  const service = new WorkspaceService(storage);

  const session = await getSession(db);
  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  const body = await request.json();
  const parsed = workspaceCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const workspace = await service.createWorkspace(
    session.userId,
    parsed.data.name,
  );
  return apiSuccess(workspace, 201);
});
