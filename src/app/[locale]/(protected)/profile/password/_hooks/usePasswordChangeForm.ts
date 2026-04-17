"use client";

import { validatePassword } from "@/domain/auth/validation";
import { useState } from "react";

export const usePasswordChangeForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validate = (): string | null => {
    if (!currentPassword.trim()) {
      return "현재 비밀번호를 입력해주세요.";
    }

    if (!newPassword.trim()) {
      return "새 비밀번호를 입력해주세요.";
    }

    if (!validatePassword(newPassword)) {
      return "비밀번호는 8자 이상의 영문, 숫자, 허용된 특수문자 조합이어야 합니다.";
    }

    if (!confirmPassword.trim()) {
      return "새 비밀번호 확인을 입력해주세요.";
    }

    if (newPassword !== confirmPassword) {
      return "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.";
    }

    if (currentPassword === newPassword) {
      return "현재 비밀번호와 다른 새 비밀번호를 입력해주세요.";
    }

    return null;
  };

  return {
    confirmPassword,
    currentPassword,
    newPassword,
    setConfirmPassword,
    setCurrentPassword,
    setNewPassword,
    validate,
  };
};
