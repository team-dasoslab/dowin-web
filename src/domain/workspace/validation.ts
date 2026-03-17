import { z } from "zod";

export const workspaceCreateSchema = z.object({
  name: z.string().min(1, "워크스페이스 이름을 입력해주세요."),
});

export const workspaceUpdateSchema = z.object({
  name: z.string().min(1, "워크스페이스 이름을 입력해주세요."),
});

export const workspaceJoinSchema = z.object({
  workspaceId: z.number(),
});

export const workspaceParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const workspaceMemberParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
});
