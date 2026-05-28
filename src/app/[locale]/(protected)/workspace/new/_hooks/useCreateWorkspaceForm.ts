"use client";

import { useState } from "react";

export const useCreateWorkspaceForm = () => {
  const [name, setName] = useState("");
  const [seatCount, setSeatCount] = useState("1");
  const [error, setError] = useState("");

  const handleNameChange = (value: string) => {
    setName(value);

    if (error) {
      setError("");
    }
  };

  const handleSeatCountChange = (value: string) => {
    setSeatCount(value);

    if (error) {
      setError("");
    }
  };

  const getValidatedName = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("워크스페이스 이름을 입력해주세요.");
      return null;
    }

    setError("");
    return trimmedName;
  };

  const getValidatedSeatCount = () => {
    const parsed = Number(seatCount);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
      setError("좌석 수는 1~999 사이의 정수여야 합니다.");
      return null;
    }

    setError("");
    return parsed;
  };

  return {
    error,
    getValidatedName,
    getValidatedSeatCount,
    name,
    seatCount,
    setError,
    handleNameChange,
    handleSeatCountChange,
  };
};
