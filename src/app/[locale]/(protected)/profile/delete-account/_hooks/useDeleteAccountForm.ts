"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export const useDeleteAccountForm = () => {
  const t = useTranslations("ProfileDeleteAccount");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  const validate = (): string | null => {
    if (!currentPassword.trim()) {
      return t("errors.passwordRequired");
    }

    if (confirmationText.trim() !== t("confirmationTextPlaceholder")) {
      return t("errors.confirmationMismatch");
    }

    return null;
  };

  return {
    confirmationText,
    currentPassword,
    setConfirmationText,
    setCurrentPassword,
    validate,
  };
};
