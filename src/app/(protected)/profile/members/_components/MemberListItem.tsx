"use client";

import type { WorkspaceMember } from "@/api/generated/wig.schemas";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UserX } from "lucide-react";

interface MemberListItemProps {
  member: WorkspaceMember;
  index: number;
  totalCount: number;
  isPendingDelete: boolean;
  onRemove: (memberId: number, nickname: string) => void;
}

export function MemberListItem({
  member,
  index,
  totalCount,
  isPendingDelete,
  onRemove,
}: MemberListItemProps) {
  const memberId = member.id ?? 0;
  const nickname = member.nickname ?? "이름 없음";
  const isSelf = member.isMe === true;

  return (
    <div
      className={`flex items-center justify-between gap-3 bg-white px-4 py-3 ${
        index < totalCount - 1 ? "border-b border-border" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          avatarKey={member.avatarKey}
          alt={`${nickname} 아바타`}
          size={40}
          fallbackClassName="rounded-lg"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-text-primary">
              {nickname}
            </p>
            <Badge
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                member.role === "ADMIN"
                  ? "bg-primary/10 text-primary"
                  : "bg-sub-background text-text-muted"
              }`}
            >
              {member.role === "ADMIN" ? "ADMIN" : "MEMBER"}
            </Badge>
            {isSelf ? (
              <Badge className="rounded-full bg-sub-background px-2 py-0.5 text-[10px] font-bold text-text-muted">
                나
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <Button
        type="button"
        disabled={isSelf || isPendingDelete || memberId <= 0}
        onClick={() => onRemove(memberId, nickname)}
        className={`flex min-w-fit items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
          isSelf
            ? "cursor-not-allowed border border-border bg-sub-background text-text-muted"
            : "border border-danger/20 bg-danger/5 text-danger hover:bg-danger/10"
        }`}
      >
        <UserX className="h-3.5 w-3.5" />
        <span>{isPendingDelete ? "처리 중..." : "퇴출"}</span>
      </Button>
    </div>
  );
}
