import { z } from "zod";

const workspaceTagNameSchema = z
  .string()
  .trim()
  .min(1, "태그 이름을 입력해주세요.")
  .max(16, "태그 이름은 16자 이하여야 합니다.");

export const workspaceCreateSchema = z.object({
  name: z.string().min(1, "워크스페이스 이름을 입력해주세요."),
});

export const workspaceCheckoutHeaderSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(255),
});

export const workspaceCheckoutSchema = z.object({
  workspaceName: z
    .string()
    .trim()
    .min(1, "워크스페이스 이름을 입력해주세요.")
    .max(100, "워크스페이스 이름은 100자 이하여야 합니다."),
  seatCount: z
    .number()
    .int("좌석 수는 정수여야 합니다.")
    .min(1, "좌석 수는 1 이상이어야 합니다.")
    .max(999, "좌석 수는 999 이하여야 합니다."),
});

export const workspaceCheckoutCompleteSchema = z.object({
  workspaceCheckoutId: z.string().trim().min(1),
  checkoutId: z.string().trim().min(1).optional(),
});

export const workspaceUpdateSchema = z.object({
  name: z.string().min(1, "워크스페이스 이름을 입력해주세요."),
  allowPastDailyLogEdit: z.boolean().optional(),
});

export const workspaceJoinSchema = z.object({
  workspaceId: z.string().min(1, "워크스페이스 ID를 입력해주세요."),
});

export const workspaceCurrentUpdateSchema = z.object({
  workspaceId: z.string().min(1, "워크스페이스 ID를 입력해주세요."),
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
  workspaceId: z.string().min(1, "워크스페이스 ID를 입력해주세요."),
});

export const workspaceMemberParamsSchema = z.object({
  workspaceId: z.string().min(1, "워크스페이스 ID를 입력해주세요."),
  memberId: z.coerce.number().int().positive(),
});

export const workspaceInviteParamsSchema = z.object({
  workspaceId: z.string().min(1, "워크스페이스 ID를 입력해주세요."),
  inviteId: z.coerce.number().int().positive(),
});

export const workspaceTagCreateSchema = z.object({
  name: workspaceTagNameSchema,
});

export const workspaceTagUpdateSchema = z.object({
  name: workspaceTagNameSchema,
});

export const workspaceTagParamsSchema = z.object({
  workspaceId: z.string().min(1, "워크스페이스 ID를 입력해주세요."),
  tagId: z.coerce.number().int().positive(),
});

export const normalizeWorkspaceTagName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();
