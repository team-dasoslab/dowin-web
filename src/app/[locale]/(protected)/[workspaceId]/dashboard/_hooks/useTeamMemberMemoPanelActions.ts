import { DashboardTeamMemo } from "@/api/generated/dowin.schemas";
import { TouchEvent, useRef, useState } from "react";

export const useTeamMemberMemoPanelActions = ({
  createMemo,
  resolveMemo,
  deleteMemo,
  closeMobileViewSheet,
  isCreatePending,
}: {
  createMemo: (content: string) => Promise<boolean>;
  resolveMemo: (memoId: number, isResolved: boolean) => Promise<boolean>;
  deleteMemo: (memoId: number) => Promise<boolean>;
  closeMobileViewSheet: () => void;
  isCreatePending: boolean;
}) => {
  const [memoDraft, setMemoDraft] = useState("");
  const [sheetDragY, setSheetDragY] = useState(0);
  const isSubmittingMemoRef = useRef(false);
  const sheetTouchStartYRef = useRef<number | null>(null);

  const handleAddMemo = async () => {
    if (isSubmittingMemoRef.current || isCreatePending) {
      return;
    }

    const content = memoDraft.trim();
    if (!content) {
      return;
    }

    isSubmittingMemoRef.current = true;

    try {
      const isSuccess = await createMemo(content);

      if (isSuccess) {
        setMemoDraft("");
      }
    } finally {
      isSubmittingMemoRef.current = false;
    }
  };

  const handleResolveMemo = async (memo: DashboardTeamMemo) => {
    await resolveMemo(memo.id, !memo.isResolved);
  };

  const handleDeleteMemo = async (memoId: number) => {
    await deleteMemo(memoId);
  };

  const handleSheetTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    sheetTouchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleSheetTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const startY = sheetTouchStartYRef.current;
    const currentY = event.touches[0]?.clientY ?? null;

    if (startY == null || currentY == null) {
      return;
    }

    const nextDragY = Math.max(0, currentY - startY);
    setSheetDragY(nextDragY);
  };

  const handleSheetTouchEnd = () => {
    if (sheetDragY > 96) {
      setSheetDragY(0);
      closeMobileViewSheet();
      sheetTouchStartYRef.current = null;
      return;
    }

    setSheetDragY(0);
    sheetTouchStartYRef.current = null;
  };

  const resetSheetDrag = () => {
    setSheetDragY(0);
    sheetTouchStartYRef.current = null;
  };

  return {
    memoDraft,
    setMemoDraft,
    sheetDragY,
    handleAddMemo,
    handleResolveMemo,
    handleDeleteMemo,
    handleSheetTouchStart,
    handleSheetTouchMove,
    handleSheetTouchEnd,
    resetSheetDrag,
  };
};
