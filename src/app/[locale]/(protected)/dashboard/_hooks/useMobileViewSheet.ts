"use client";

import { useEffect, useRef, useState } from "react";

type UseMobileViewSheetParams = {
  isOpen: boolean;
  onClose?: () => void;
  closeDurationMs?: number;
  enterDurationMs?: number;
};

export function useMobileViewSheet({
  isOpen,
  onClose,
  closeDurationMs = 220,
  enterDurationMs = 16,
}: UseMobileViewSheetParams) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    if (isOpen) {
      setIsClosing(false);
      setIsEntering(true);
      setIsVisible(true);
      enterTimerRef.current = setTimeout(() => {
        setIsEntering(false);
        enterTimerRef.current = null;
      }, enterDurationMs);
      return;
    }

    setIsVisible(false);
    setIsClosing(false);
    setIsEntering(false);
  }, [enterDurationMs, isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
      }
    };
  }, []);

  const closeSheet = () => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);

    closeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setIsEntering(false);
      closeTimerRef.current = null;
      onClose?.();
    }, closeDurationMs);
  };

  return {
    isVisible,
    isClosing,
    isEntering,
    closeSheet,
  };
}
