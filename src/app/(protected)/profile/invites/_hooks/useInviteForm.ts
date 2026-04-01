"use client";

import { useState } from "react";
import { z } from "zod";

const createInviteSchema = z.object({
  maxUses: z
    .number()
    .int("사용 횟수는 정수여야 합니다.")
    .min(1, "사용 횟수는 1 이상이어야 합니다.")
    .max(999, "사용 횟수는 999 이하여야 합니다."),
});

export const useInviteForm = () => {
  const [maxUsesInput, setMaxUsesInput] = useState("3");
  const [formError, setFormError] = useState("");

  const handleMaxUsesInputChange = (value: string) => {
    setMaxUsesInput(value);

    if (formError) {
      setFormError("");
    }
  };

  const selectPresetMaxUses = (value: number) => {
    setMaxUsesInput(String(value));

    if (formError) {
      setFormError("");
    }
  };

  const getValidatedMaxUses = () => {
    const parsed = createInviteSchema.safeParse({
      maxUses: Number(maxUsesInput),
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.");
      return null;
    }

    setFormError("");
    return parsed.data.maxUses;
  };

  return {
    formError,
    maxUsesInput,
    getValidatedMaxUses,
    handleMaxUsesInputChange,
    selectPresetMaxUses,
  };
};
