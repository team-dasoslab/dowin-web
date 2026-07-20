import { createRepositoryLinkService } from "@/domain/github-integration/services/repository-link.service";
import { workspaceParamsSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

const ParamsSchema = workspaceParamsSchema.extend({
  repositoryLinkId: z.coerce.number().int().positive(),
});

export const DELETE = withWorkspaceAccess<{ workspaceId: string; repositoryLinkId: string }>(
  async (req, { context, params }) => {
    const { env } = await getCloudflareContext();

    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.format());
    }

    if (context.role !== "ADMIN") {
      return apiError("FORBIDDEN");
    }

    const service = createRepositoryLinkService(env as unknown as CloudflareEnv);

    await service.disconnectRepository(
      context.workspaceId,
      parsedParams.data.repositoryLinkId,
    );

    return apiSuccess({ success: true });
  },
);
