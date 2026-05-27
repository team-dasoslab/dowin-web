import { getDb } from "@/db";
import { DailyLogService } from "@/domain/daily-log/services/daily-log.service";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import {
  dailyLogDateParamSchema,
  dailyLogUpsertSchema,
} from "@/domain/daily-log/validation";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { getSessionWithRefresh } from "@/lib/server/auth";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withErrorHandler } from "@/lib/server/with-error-handler";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

const createService = (db: ReturnType<typeof getDb>) =>
  new DailyLogService(
    new WorkspaceStorage(db),
    new ScoreboardStorage(db),
    new LeadMeasureStorage(db),
    new DailyLogStorage(db),
  );

export const PUT = withErrorHandler(async (request: Request, { params }: { params: Promise<{ workspaceId: string, id: string, date: string }> }) => {
  const { workspaceId } = await params;
const { env } = getCloudflareContext();
    const db = getDb(env.DB);
    const session = await getSessionWithRefresh(db);

    if (!session) {
      return await apiError("UNAUTHORIZED");
    }

    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: session.userId,
      env,
      intent: "daily-log-upsert",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const routeParams = await params;
    const validatedParams = dailyLogDateParamSchema.safeParse({
      leadMeasureId: routeParams.id,
      date: routeParams.date,
    });
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const parsed = dailyLogUpsertSchema.safeParse(await request.json());
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const result = await createService(db).upsertLog(workspaceId, validatedParams.data.leadMeasureId,
      session.userId,
      validatedParams.data.date,
      parsed.data.value,
    );
    return apiSuccess(result);
  },
);

export const DELETE = withErrorHandler(async (request: Request, { params }: { params: Promise<{ workspaceId: string, id: string, date: string }> }) => {
  const { workspaceId } = await params;
const { env } = getCloudflareContext();
    const db = getDb(env.DB);
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

    const routeParams = await params;
    const validatedParams = dailyLogDateParamSchema.safeParse({
      leadMeasureId: routeParams.id,
      date: routeParams.date,
    });
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    await createService(db).deleteLog(workspaceId, validatedParams.data.leadMeasureId,
      session.userId,
      validatedParams.data.date,
    );

    return new NextResponse(null, { status: 204 });
  },
);
