import { createRepositoryLinkService } from "@/domain/github-integration/services/repository-link.service";
import { workspaceParamsSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAdmin } from "@/lib/server/with-workspace-access";
import { z } from "zod";

const ParamsSchema = workspaceParamsSchema.extend({
  repositoryLinkId: z.coerce.number().int().positive(),
});

export const DELETE = withWorkspaceAdmin<{ workspaceId: string; repositoryLinkId: string }>(
  async (_, { context, params, env }) => {
    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.format());
    }

    const service = createRepositoryLinkService(env as unknown as CloudflareEnv);

    await service.disconnectRepository(context.workspaceId, parsedParams.data.repositoryLinkId);

    return apiSuccess({ success: true });
  },
);
