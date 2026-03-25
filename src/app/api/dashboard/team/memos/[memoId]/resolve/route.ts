import { getDb } from "@/db";
import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import { dashboardTeamMemoResolveSchema } from "@/domain/dashboard/validation";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const createService = (db: ReturnType<typeof getDb>) =>
  new TeamMemoService(new WorkspaceStorage(db), new TeamMemoStorage(db));

export const PATCH = withErrorHandler(
  async (
    request: Request,
    context: { params: Promise<{ memoId: string }> },
  ) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const { memoId } = await context.params;
    const memoIdValue = Number(memoId);
    const parsed = dashboardTeamMemoResolveSchema.safeParse(await request.json());

    if (!Number.isInteger(memoIdValue) || memoIdValue <= 0) {
      return apiError("VALIDATION_ERROR", {
        memoId: ["유효한 메모 ID를 입력해주세요."],
      });
    }

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const result = await createService(db).resolveTeamMemo(
      session.userId,
      memoIdValue,
      parsed.data.isResolved,
    );

    return apiSuccess(result);
  },
);
