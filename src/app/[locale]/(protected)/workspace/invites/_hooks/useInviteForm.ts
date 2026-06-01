"use client";

import { useState } from "react";
import { z } from "zod";

import { useTranslations } from "next-intl";

export const useInviteForm = () => {
  const t = useTranslations("ProfileInvites");
  const [maxUsesInput, setMaxUsesInput] = useState("3");
  const [formError, setFormError] = useState("");

  const createInviteSchema = z.object({
    maxUses: z
      .number()
      .int(t("errorInt"))
      .min(1, t("errorMin"))
      .max(999, t("errorMax")),
  });

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
      setFormError(parsed.error.issues[0]?.message ?? t("errorInvalid"));
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
