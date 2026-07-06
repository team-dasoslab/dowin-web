"use client";

import {
  DashboardTeamMemo,
  TeamDashboardMember,
  TeamDashboardMemberRole,
} from "@/api/generated/dowin.schemas";
import { useMobileViewSheet } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_hooks/useMobileViewSheet";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { UserAvatar } from "@/components/UserAvatar";
import { Input } from "@/components/ui/Input";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useTeamMemberMemoPanelActions } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_hooks/useTeamMemberMemoPanelActions";
import { formatRelativeTime } from "@/app/[locale]/(protected)/[workspaceId]/dashboard/_utils/teamMemberMemo";
import { createPortal } from "react-dom";

const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? createPortal(children, document.body) : null;
};

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
  const t = useTranslations("Comments");

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

  const {
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
  } = useTeamMemberMemoPanelActions({
    createMemo,
    resolveMemo,
    deleteMemo,
    closeMobileViewSheet,
    isCreatePending,
  });

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
      resetSheetDrag();
    }
  }, [memoMode, resetSheetDrag]);

  return (
    <>
      {shouldShowMemoRail && (
        <Portal>
          <div className="fixed inset-0 z-[200] h-dvh overflow-hidden bg-black/55 backdrop-blur-[1px] md:hidden">
            {isComposeMode ? (
              <>
                <button
                  type="button"
                  onClick={onCloseMemo}
                  className="absolute inset-0"
                  aria-label={t("closeMemo")}
                />
                <div
                  className="absolute inset-x-0 bottom-0 bg-surface px-4 pt-3 pb-[calc(0.75rem+var(--safe-area-inset-bottom,0px))]"
                >
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
                      placeholder={t("addComment")}
                      className="flex-1"
                      size="sm"
                      disabled={isCreatePending}
                    />
                    <Button
                      type="button"
                      onClick={() => void handleAddMemo()}
                      disabled={!memoDraft.trim() || isCreatePending}
                      variant="ghost-primary"
                      className="h-10 w-10 shrink-0 rounded-full"
                      aria-label={t("submitMemo")}
                    >
                      <DowinIcon name="action-send" size="16px" />
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
                  aria-label={t("closeMemo")}
                />
                <div
                  className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-hidden rounded-t-[28px] bg-surface pb-[var(--safe-area-inset-bottom,0px)] transition-transform duration-200 ease-out"
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
                        avatarSeed={member.nickname}
                        alt={`${member.nickname ?? "사용자"} 아바타`}
                        size={28}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-text-primary">
                          {member.nickname}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {t("viewMemos")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="overflow-y-auto px-4 py-4 pb-6"
                    style={{ maxHeight: "calc(78dvh - 73px)" }}
                  >
                    <div className="space-y-3">
                      {isMemosLoading ? (
                        <MemoStatusCard message={t("loadingMemos")} />
                      ) : isMemosError ? (
                        <MemoStatusCard message={t("memosError")} />
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
        </Portal>
      )}

      {shouldShowMemoRail && (
        <div className="hidden space-y-3 md:hidden xl:absolute xl:left-[calc(100%+20px)] xl:top-8 xl:block xl:w-[300px]">
          {isComposeMode ? (
            <div className="rounded-[24px] bg-surface p-2.5">
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
                  placeholder={t("addComment")}
                  className="flex-1 w-full"
                  variant="ghost"
                  size="sm"
                  disabled={isCreatePending}
                />
                <Button
                  type="button"
                  onClick={() => void handleAddMemo()}
                  disabled={!memoDraft.trim() || isCreatePending}
                  variant="ghost-primary"
                  className="h-8 w-8 shrink-0 rounded-full"
                  aria-label={t("submitMemo")}
                >
                  <DowinIcon name="action-send" size="16px" />
                </Button>
              </div>
            </div>
          ) : null}

          {memoMode === "view" && (
            <div className="space-y-3 pb-20">
              {isMemosLoading ? (
                <MemoStatusCard message={t("loadingMemos")} />
              ) : isMemosError ? (
                <MemoStatusCard message={t("memosError")} />
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
          )}
        </div>
      )}
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
  const t = useTranslations("Comments");
  const canResolveMemo =
    currentUserRole === TeamDashboardMemberRole.ADMIN ||
    memo.author.userId === currentUserId;
  const canDeleteMemo = memo.author.userId === currentUserId;
  const isOptimisticMemo = memo.id <= 0;

  return (
    <div
      className={`rounded-[16px] px-4 py-3 transition-colors ${
        memo.isResolved
          ? "bg-sub-background/50 xl:bg-surface/60"
          : "bg-sub-background xl:bg-surface xl:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar
            avatarKey={memo.author.avatarKey}
            avatarSeed={memo.author.nickname}
            alt={`${memo.author.nickname} 아바타`}
            size={24}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-bold text-text-primary">
                {memo.author.nickname}
              </p>
              <span className="text-[11px] text-text-muted">
                {formatRelativeTime(memo.createdAt, t)}
              </span>
            </div>
          </div>
        </div>
        {canResolveMemo || canDeleteMemo ? (
          <div className="flex items-center overflow-hidden rounded-[12px] bg-sub-background">
            {canResolveMemo ? (
              <Button
                type="button"
                onClick={() => void onResolve(memo)}
                disabled={isResolvePending || isOptimisticMemo}
                variant={memo.isResolved ? "ghost-primary" : "subtle"}
                size="icon"
                className="rounded-none bg-transparent hover:bg-border/50"
                aria-label={t("verifyMemo")}
              >
                <DowinIcon name="action-checkmark" size="16px" />
              </Button>
            ) : null}
            {canDeleteMemo ? (
              <Button
                type="button"
                onClick={() => void onDelete(memo.id)}
                disabled={isDeletePending || isOptimisticMemo}
                variant="subtle"
                size="icon"
                className="rounded-none bg-transparent hover:bg-border/50"
                aria-label={t("deleteMemo")}
              >
                <DowinIcon name="action-delete" size="16px" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <p
        className={`mt-2 text-sm leading-6 ${
          memo.isResolved
            ? "text-text-muted line-through"
            : "text-text-primary"
        }`}
      >
        {memo.content}
      </p>
    </div>
  );
}

function MemoStatusCard({ message }: { message: string }) {
  return (
    <div className="rounded-[16px] bg-surface px-4 py-4">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

