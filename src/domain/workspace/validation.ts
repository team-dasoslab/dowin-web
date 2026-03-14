import { z } from "zod";

export const workspaceCreateSchema = z.object({
  name: z.string().min(1, "워크스페이스 이름을 입력해주세요."),
});

export const workspaceJoinSchema = z.object({
  workspaceId: z.number(),
});
