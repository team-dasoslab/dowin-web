"use client";

import { useMobileViewSheet } from "@/app/(protected)/dashboard/_hooks/useMobileViewSheet";
import {
  DashboardTeamMemo,
  TeamDashboardMember,
  TeamDashboardMemberRole,
} from "@/api/generated/wig.schemas";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ArrowUp, Check, Trash2 } from "lucide-react";
import { TouchEvent, useEffect, useRef, useState } from "react";

type TeamMemberMemoPanelProps = {
  member: TeamDashboardMember;
  memoMode?: "compose" | "view" | null;
  onCloseMemo?: () => void;
  memos: DashboardTeamMemo[];
  isMemosLoading: boolean;
  isMemosError: boolean;
  isCreatePending: boolean;
  isResolvePending: boolean;
  isDeletePending: boolean;
  createMemo: (content: string) => Promise<boolean>;
  resolveMemo: (memoId: number, isResolved: boolean) => Promise<boolean>;
  deleteMemo: (memoId: number) => Promise<boolean>;
  currentUserId?: number | null;
  currentUserRole?: TeamDashboardMemberRole | null;
};

export function TeamMemberMemoPanel({
  member,
  memoMode = null,
  onCloseMemo,
  memos,
  isMemosLoading,
  isMemosError,
  isCreatePending,
  isResolvePending,
  isDeletePending,
  createMemo,
  resolveMemo,
  deleteMemo,
  currentUserId,
  currentUserRole,
}: TeamMemberMemoPanelProps) {
  const [memoDraft, setMemoDraft] = useState("");
  const [sheetDragY, setSheetDragY] = useState(0);
  const isSubmittingMemoRef = useRef(false);
  const sheetTouchStartYRef = useRef<number | null>(null);
  const {
    isVisible: isMobileViewSheetVisible,
    isClosing: isMobileViewSheetClosing,
    isEntering: isMobileViewSheetEntering,
    closeSheet: closeMobileViewSheet,
  } = useMobileViewSheet({
    isOpen: memoMode === "view",
    onClose: onCloseMemo,
  });
  const hasMemos = memos.length > 0;
  const isComposeMode = memoMode === "compose";
  const shouldShowMemoRail = memoMode !== null;

  useEffect(() => {
    if (!shouldShowMemoRail) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldShowMemoRail]);

  useEffect(() => {
    if (memoMode !== "view") {
      setSheetDragY(0);
      sheetTouchStartYRef.current = null;
    }
  }, [memoMode]);

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

  if (!shouldShowMemoRail) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] h-dvh overflow-hidden bg-black/55 backdrop-blur-[1px] md:hidden">
        {isComposeMode ? (
          <>
            <button
              type="button"
              onClick={onCloseMemo}
              className="absolute inset-0"
              aria-label="메모 닫기"
            />
            <div className="absolute inset-x-0 bottom-0 border-t border-border bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Input
                  value={memoDraft}
                  onChange={(event) => setMemoDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleAddMemo();
                    }
                  }}
                  placeholder="댓글 추가"
                  className="h-10 flex-1 rounded-xl border border-border bg-white px-3 text-sm text-text-primary placeholder:text-text-muted"
                  disabled={isCreatePending}
                />
                <Button
                  type="button"
                  onClick={() => void handleAddMemo()}
                  disabled={!memoDraft.trim() || isCreatePending}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary disabled:opacity-40"
                  aria-label="메모 등록"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : isMobileViewSheetVisible ? (
          <>
            <button
              type="button"
              onClick={closeMobileViewSheet}
              className={`absolute inset-0 transition-opacity duration-200 ${
                isMobileViewSheetClosing || isMobileViewSheetEntering
                  ? "opacity-0"
                  : "opacity-100"
              }`}
              aria-label="메모 닫기"
            />
            <div
              className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-18px_40px_rgba(15,23,42,0.18)] transition-transform duration-200 ease-out"
              style={{
                transform: isMobileViewSheetClosing
                  ? "translateY(100%)"
                  : isMobileViewSheetEntering
                    ? "translateY(100%)"
                  : `translateY(${sheetDragY}px)`,
              }}
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
            >
              <div className="flex justify-center pt-3">
                <span className="h-1.5 w-12 rounded-full bg-border" />
              </div>
              <div className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    avatarKey={member.avatarKey}
                    alt={`${member.nickname ?? "사용자"} 아바타`}
                    size={28}
                    className="rounded-md"
                    fallbackClassName="rounded-md"
                    imageClassName="rounded-md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text-primary">
                      {member.nickname}
                    </p>
                    <p className="truncate text-xs text-text-muted">메모 보기</p>
                  </div>
                </div>
              </div>

              <div
                className="overflow-y-auto px-4 py-4 pb-6"
                style={{ maxHeight: "calc(78dvh - 73px)" }}
              >
                <div className="space-y-3">
                  {isMemosLoading ? (
                    <MemoStatusCard message="메모를 불러오는 중입니다." />
                  ) : isMemosError ? (
                    <MemoStatusCard message="메모를 불러오지 못했습니다." />
                  ) : hasMemos ? (
                    memos.map((memo) => (
                      <MemoCard
                        key={memo.id}
                        memo={memo}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        isResolvePending={isResolvePending}
                        isDeletePending={isDeletePending}
                        onResolve={handleResolveMemo}
                        onDelete={handleDeleteMemo}
                      />
                    ))
                  ) : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="hidden space-y-3 md:hidden xl:absolute xl:left-[calc(100%+20px)] xl:top-8 xl:block xl:w-[300px]">
        {isComposeMode ? (
          <Card className="rounded-2xl border border-border bg-white p-2.5 shadow-none">
            <div className="flex items-center gap-2">
              <Input
                value={memoDraft}
                onChange={(event) => setMemoDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleAddMemo();
                  }
                }}
                placeholder="댓글 추가"
                className="h-8 flex-1 border-0 bg-transparent px-2 text-xs text-text-primary outline-none placeholder:text-text-muted"
                disabled={isCreatePending}
              />
              <Button
                type="button"
                onClick={() => void handleAddMemo()}
                disabled={!memoDraft.trim() || isCreatePending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary disabled:opacity-40"
                aria-label="메모 등록"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ) : null}

        <div className="space-y-3 pb-20">
          {isMemosLoading ? (
            <MemoStatusCard message="메모를 불러오는 중입니다." />
          ) : isMemosError ? (
            <MemoStatusCard message="메모를 불러오지 못했습니다." />
          ) : hasMemos ? (
            memos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isResolvePending={isResolvePending}
                isDeletePending={isDeletePending}
                onResolve={handleResolveMemo}
                onDelete={handleDeleteMemo}
              />
            ))
          ) : null}
        </div>
      </div>
    </>
  );
}

type MemoCardProps = {
  memo: DashboardTeamMemo;
  currentUserId?: number | null;
  currentUserRole?: TeamDashboardMemberRole | null;
  isResolvePending: boolean;
  isDeletePending: boolean;
  onResolve: (memo: DashboardTeamMemo) => Promise<void>;
  onDelete: (memoId: number) => Promise<void>;
};

function MemoCard({
  memo,
  currentUserId,
  currentUserRole,
  isResolvePending,
  isDeletePending,
  onResolve,
  onDelete,
}: MemoCardProps) {
  const canResolveMemo =
    currentUserRole === TeamDashboardMemberRole.ADMIN ||
    memo.author.userId === currentUserId;
  const canDeleteMemo = memo.author.userId === currentUserId;
  const isOptimisticMemo = memo.id <= 0;

  return (
    <Card
      className={`rounded-xl border px-4 py-3 transition-colors ${
        memo.isResolved
          ? "border-primary/20 bg-primary/5"
          : "border-border bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar
            avatarKey={memo.author.avatarKey}
            alt={`${memo.author.nickname} 아바타`}
            size={24}
            className="rounded-md"
            fallbackClassName="rounded-md"
            imageClassName="rounded-md"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-bold text-text-primary">
                {memo.author.nickname}
              </p>
              <span className="text-[11px] text-text-muted">
                {formatRelativeTime(memo.createdAt)}
              </span>
            </div>
          </div>
        </div>
        {canResolveMemo || canDeleteMemo ? (
          <div className="flex items-center overflow-hidden rounded-lg border border-border bg-white">
            {canResolveMemo ? (
              <button
                type="button"
                onClick={() => void onResolve(memo)}
                disabled={isResolvePending || isOptimisticMemo}
                className={`inline-flex h-8 w-8 items-center justify-center transition-colors disabled:opacity-50 ${
                  memo.isResolved
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-sub-background hover:text-text-primary"
                }`}
                aria-label="댓글 확인"
              >
                <Check className="h-4 w-4" />
              </button>
            ) : null}
            {canDeleteMemo ? (
              <button
                type="button"
                onClick={() => void onDelete(memo.id)}
                disabled={isDeletePending || isOptimisticMemo}
                className={`inline-flex h-8 w-8 items-center justify-center text-text-muted transition-colors hover:bg-sub-background hover:text-red-500 disabled:opacity-50 ${
                  canResolveMemo ? "border-l border-border" : ""
                }`}
                aria-label="댓글 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <p
        className={`mt-2 text-sm leading-6 ${
          memo.isResolved
            ? "text-text-secondary line-through"
            : "text-text-primary"
        }`}
      >
        {memo.content}
      </p>
    </Card>
  );
}

function MemoStatusCard({ message }: { message: string }) {
  return (
    <Card className="rounded-xl border border-border bg-white px-4 py-4">
      <p className="text-sm text-text-muted">{message}</p>
    </Card>
  );
}

function formatRelativeTime(createdAt: string) {
  const createdAtTime = new Date(createdAt).getTime();

  if (!Number.isFinite(createdAtTime)) {
    return "";
  }

  const diffMin = Math.floor((Date.now() - createdAtTime) / (1000 * 60));
  if (diffMin <= 0) {
    return "지금";
  }
  if (diffMin < 60) {
    return `${diffMin}분 전`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}시간 전`;
  }

  return `${Math.floor(diffHour / 24)}일 전`;
}
