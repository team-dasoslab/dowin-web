import { getDb } from "@/db";
import { ProfileService } from "@/domain/profile/services/profile.service";
import { ProfileStorage } from "@/domain/profile/storage/profile.storage";
import { profileUpdateSchema } from "@/domain/profile/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSession } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const createService = (db: ReturnType<typeof getDb>) =>
  new ProfileService(new ProfileStorage(db));

export const GET = withErrorHandler(async () => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  const profile = await createService(db).getMyProfile(session.userId);
  return apiSuccess(profile);
});

export const PUT = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const session = await getSession(db);

  if (!session) {
    return apiError("UNAUTHORIZED");
  }

  const parsed = profileUpdateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
  }

  const profile = await createService(db).updateNickname(
    session.userId,
    parsed.data.nickname,
  );

  return apiSuccess(profile);
});
