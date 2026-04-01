"use client";

import { useState } from "react";

export const useCreateWorkspaceForm = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleNameChange = (value: string) => {
    setName(value);

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

  return {
    error,
    getValidatedName,
    name,
    setError,
    handleNameChange,
  };
};
