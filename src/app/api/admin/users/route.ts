import { getDb } from "@/db";
import { AuthService } from "@/domain/auth/services/auth.service";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { adminCreateUserSchema } from "@/domain/auth/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSession } from "@/lib/server/auth";
import { requireWorkspaceAdmin } from "@/lib/server/authz";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const POST = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const storage = new AuthStorage(db);
  const service = new AuthService(storage);
  const workspaceStorage = new WorkspaceStorage(db);

  const session = await getSession(db);
  if (!session) {
    return apiError("UNAUTHORIZED");
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

  const adminMembership = await requireWorkspaceAdmin(db, session.userId);

  const body = await request.json();
  const parsed = adminCreateUserSchema.safeParse(body);

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const newUser = await service.createUser(
    parsed.data.customId,
    parsed.data.nickname,
    parsed.data.password,
  );
  await workspaceStorage.addMember(adminMembership.workspaceId, newUser.id, "MEMBER");

  return apiSuccess(
    {
      customId: newUser.customId,
      nickname: newUser.nickname,
    },
    201,
  );
});
