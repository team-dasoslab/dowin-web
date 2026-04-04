"use client";

import { useState } from "react";

export const useDeleteAccountForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  const validate = (): string | null => {
    if (!currentPassword.trim()) {
      return "현재 비밀번호를 입력해주세요.";
    }

    if (confirmationText.trim() !== "탈퇴합니다") {
      return "확인 문구를 정확히 입력해주세요.";
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
