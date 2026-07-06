"use client";

import { useState } from "react";

export const useCreateWorkspaceForm = () => {
  const [name, setName] = useState("");
  const [seatCount, setSeatCount] = useState("1");
  const [promotionCode, setPromotionCode] = useState("");
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

  const handlePromotionCodeChange = (value: string) => {
    setPromotionCode(value);

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

  const getValidatedPromotionCode = () => {
    return promotionCode.trim();
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    onSubmit: (name: string, seatCount: number, promotionCode: string) => void,
  ) => {
    e.preventDefault();

    const validatedName = getValidatedName();
    if (!validatedName) {
      return;
    }

    let validatedSeatCount = 1;
    if (!promotionCode) {
      const seat = getValidatedSeatCount();
      if (seat === null) return;
      validatedSeatCount = seat;
    }

    const validatedPromotionCode = getValidatedPromotionCode();

    onSubmit(validatedName, validatedSeatCount, validatedPromotionCode);
  };

  return {
    error,
    getValidatedName,
    getValidatedSeatCount,
    getValidatedPromotionCode,
    name,
    seatCount,
    promotionCode,
    setError,
    handleNameChange,
    handleSeatCountChange,
    handlePromotionCodeChange,
    handleSubmit,
  };
};
