import { createRepositoryLinkService } from "@/domain/github-integration/services/repository-link.service";
import { workspaceParamsSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const GET = withWorkspaceAccess(
  async (req, { context, params }) => {
    const { env } = await getCloudflareContext();

    const parsedParams = workspaceParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.format());
    }

    if (context.role !== "ADMIN") {
      return apiError("FORBIDDEN");
    }

    const service = createRepositoryLinkService(env as unknown as CloudflareEnv);
    const status = await service.getWorkspaceIntegrationStatus(
      context.workspaceId,
      context.userId,
    );

    return apiSuccess(status);
  },
);
