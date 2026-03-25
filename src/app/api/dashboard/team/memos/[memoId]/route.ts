import { getDb } from "@/db";
import { TeamMemoService } from "@/domain/dashboard/services/team-memo.service";
import { TeamMemoStorage } from "@/domain/dashboard/storage/team-memo.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

const createService = (db: ReturnType<typeof getDb>) =>
  new TeamMemoService(new WorkspaceStorage(db), new TeamMemoStorage(db));

export const DELETE = withErrorHandler(
  async (_request: Request, context: { params: Promise<{ memoId: string }> }) => {
    const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return apiError("UNAUTHORIZED");
    }

    const { memoId } = await context.params;
    const memoIdValue = Number(memoId);

    if (!Number.isInteger(memoIdValue) || memoIdValue <= 0) {
      return apiError("VALIDATION_ERROR", {
        memoId: ["유효한 메모 ID를 입력해주세요."],
      });
    }

    await createService(db).deleteTeamMemo(session.userId, memoIdValue);

    return new NextResponse(null, { status: 204 });
  },
);
