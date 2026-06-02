"use client";

import { useState } from "react";
import { z } from "zod";

const joinByInviteSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "초대코드를 입력해주세요.")
    .max(32, "초대코드는 32자 이하여야 합니다."),
});

type UseJoinWorkspaceFormParams = {
  onSubmitCode: (code: string) => void;
};

export const useJoinWorkspaceForm = ({
  onSubmitCode,
}: UseJoinWorkspaceFormParams) => {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const handleInviteCodeChange = (value: string) => {
    setInviteCode(value);

    if (error) {
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = joinByInviteSchema.safeParse({ code: inviteCode });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "초대코드를 확인해주세요.");
      return;
    }

    setError("");
    onSubmitCode(parsed.data.code.toUpperCase());
  };

  return {
    error,
    inviteCode,
    setError,
    handleInviteCodeChange,
    handleSubmit,
  };
};
