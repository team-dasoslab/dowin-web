import { createRepositoryLinkService } from "@/domain/github-integration/services/repository-link.service";
import { workspaceParamsSchema } from "@/domain/workspace/validation";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { withWorkspaceAccess } from "@/lib/server/with-workspace-access";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

const BodySchema = z.object({
  repositoryId: z.coerce.number().int().positive(),
});

export const POST = withWorkspaceAccess(
  async (req, { context, params }) => {
    const { env } = await getCloudflareContext();

    const parsedParams = workspaceParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return apiError("VALIDATION_ERROR", parsedParams.error.format());
    }

    const body = await req.json().catch(() => ({}));
    const parsedBody = BodySchema.safeParse(body);
    if (!parsedBody.success) {
      return apiError("VALIDATION_ERROR", parsedBody.error.format());
    }

    if (context.role !== "ADMIN") {
      return apiError("FORBIDDEN");
    }

    const service = createRepositoryLinkService(env as unknown as CloudflareEnv);

    await service.linkRepository(
      context.workspaceId,
      context.userId,
      parsedBody.data.repositoryId,
    );

    return apiSuccess({ success: true });
  },
);
