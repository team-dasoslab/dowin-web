import { DailyLogService } from "@/domain/daily-log/services/daily-log.service";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import {
  dailyLogDateParamSchema,
  dailyLogUpsertSchema,
} from "@/domain/daily-log/validation";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { guardRestrictedTestAccountWrite } from "@/lib/server/restricted-test-account";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { NextResponse } from "next/server";

export const PUT = withWorkspaceAccess<{ workspaceId: string, id: string, date: string }>(
  async (request, { context, db, env, params }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "daily-log-upsert",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const validatedParams = dailyLogDateParamSchema.safeParse({
      leadMeasureId: params.id,
      date: params.date,
    });
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const parsed = dailyLogUpsertSchema.safeParse(await request.json());
    if (!parsed.success) {
      return await apiError("VALIDATION_ERROR", parsed.error.flatten().fieldErrors);
    }

    const service = new DailyLogService(
      new ScoreboardStorage(db),
      new LeadMeasureStorage(db),
      new DailyLogStorage(db),
    );

    const result = await service.upsertLog(
      context,
      validatedParams.data.leadMeasureId,
      validatedParams.data.date,
      parsed.data,
    );
    return apiSuccess(result);
  },
);

export const DELETE = withWorkspaceAccess<{ workspaceId: string, id: string, date: string }>(
  async (_request, { context, db, env, params }) => {
    const restrictedWriteResponse = await guardRestrictedTestAccountWrite({
      db,
      userId: context.userId,
      env,
      intent: "general-write",
    });
    if (restrictedWriteResponse) {
      return restrictedWriteResponse;
    }

    const validatedParams = dailyLogDateParamSchema.safeParse({
      leadMeasureId: params.id,
      date: params.date,
    });
    if (!validatedParams.success) {
      return await apiError("VALIDATION_ERROR", validatedParams.error.flatten().fieldErrors);
    }

    const service = new DailyLogService(
      new ScoreboardStorage(db),
      new LeadMeasureStorage(db),
      new DailyLogStorage(db),
    );

    await service.deleteLog(
      context,
      validatedParams.data.leadMeasureId,
      validatedParams.data.date,
    );

    return new NextResponse(null, { status: 204 });
  },
);
