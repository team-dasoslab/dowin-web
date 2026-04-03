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

export const workspaceJoinByInviteSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "초대코드를 입력해주세요.")
    .max(32, "초대코드는 32자 이하여야 합니다."),
});

export const workspaceInviteCreateSchema = z.object({
  maxUses: z
    .number()
    .int("사용 가능 횟수는 정수여야 합니다.")
    .min(1, "사용 가능 횟수는 1 이상이어야 합니다.")
    .max(999, "사용 가능 횟수는 999 이하여야 합니다."),
});

export const workspaceInviteStatusUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const workspaceTransferAdminSchema = z.object({
  memberId: z.number().int().positive(),
});

export const workspaceParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const workspaceMemberParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
});

export const workspaceInviteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  inviteId: z.coerce.number().int().positive(),
});
