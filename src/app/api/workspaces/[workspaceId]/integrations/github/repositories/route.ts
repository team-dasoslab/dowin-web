import { createRepositoryLinkService } from "@/domain/github-integration/services/repository-link.service";
import { workspaceParamsSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAdmin } from "@/lib/server/with-workspace-access";
import { z } from "zod";

const BodySchema = z.object({
  repositoryId: z.coerce.number().int().positive(),
});

export const POST = withWorkspaceAdmin(async (req, { context, params, env }) => {
  const parsedParams = workspaceParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return apiError("VALIDATION_ERROR", parsedParams.error.format());
  }

  const body = await req.json().catch(() => ({}));
  const parsedBody = BodySchema.safeParse(body);
  if (!parsedBody.success) {
    return apiError("VALIDATION_ERROR", parsedBody.error.format());
  }

  const service = createRepositoryLinkService(env);

  await service.linkRepository(context.workspaceId, context.userId, parsedBody.data.repositoryId);

  return apiSuccess({ success: true });
});
