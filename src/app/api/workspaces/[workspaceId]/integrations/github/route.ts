import { createRepositoryLinkService } from "@/domain/github-integration/services/repository-link.service";
import { workspaceParamsSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAdmin } from "@/lib/server/with-workspace-access";

export const GET = withWorkspaceAdmin(async (_, { context, params, env }) => {
  const parsedParams = workspaceParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return apiError("VALIDATION_ERROR", parsedParams.error.format());
  }

  const service = createRepositoryLinkService(env as unknown as CloudflareEnv);
  const status = await service.getWorkspaceIntegrationStatus(context.workspaceId, context.userId);

  return apiSuccess(status);
});
