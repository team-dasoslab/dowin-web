import { z } from "zod";
import { PROFILE_AVATAR_KEYS } from "@/domain/profile/avatar-options";

const NICKNAME_REGEX = /^[A-Za-z0-9가-힣 ]+$/;

export const profileUpdateSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(2, "닉네임은 2자 이상이어야 합니다.")
      .max(20, "닉네임은 20자 이하여야 합니다.")
      .regex(NICKNAME_REGEX, "닉네임에는 특수문자를 사용할 수 없습니다.")
      .optional(),
    avatarKey: z.enum(PROFILE_AVATAR_KEYS).nullable().optional(),
  })
  .refine(
    (value) => value.nickname !== undefined || value.avatarKey !== undefined,
    {
      message: "변경할 프로필 정보가 없습니다.",
    },
  );
