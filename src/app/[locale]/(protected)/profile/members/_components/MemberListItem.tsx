"use client";

import type { WorkspaceMember } from "@/api/generated/dowin.schemas";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";

interface MemberListItemProps {
  member: WorkspaceMember;
  index: number;
  totalCount: number;
  isPendingDelete: boolean;
  isPendingTransfer: boolean;
  onRemove: (memberId: number, nickname: string) => void;
  onTransferAdmin: (memberId: number, nickname: string) => void;
}

import { useTranslations } from "next-intl";

export function MemberListItem({
  member,
  index,
  totalCount,
  isPendingDelete,
  isPendingTransfer,
  onRemove,
  onTransferAdmin,
}: MemberListItemProps) {
  const t = useTranslations("Profile");
  const memberId = member.id ?? 0;
  const nickname = member.nickname ?? t("defaultNickname");
  const isSelf = member.isMe === true;
  const canTransferAdmin = !isSelf && member.role !== "ADMIN" && memberId > 0;
  const canRemove = !isSelf && memberId > 0;

  return (
    <div
      className={`flex items-center justify-between gap-3 bg-white px-4 py-3 ${
        index < totalCount - 1 ? "border-b border-border" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          avatarKey={member.avatarKey}
          avatarSeed={member.nickname}
          alt={t("avatarAlt", { name: nickname })}
          size={40}
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
                {t("me")}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canTransferAdmin ? (
          <Button
            type="button"
            disabled={isPendingTransfer || isPendingDelete}
            onClick={() => onTransferAdmin(memberId, nickname)}
            className="flex min-w-fit items-center justify-center gap-1.5 rounded-content border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <DowinIcon name="status-locked" size="14px" />
            <span>{isPendingTransfer ? t("processing") : t("transferAdmin")}</span>
          </Button>
        ) : null}

        <Button
          type="button"
          disabled={!canRemove || isPendingDelete || isPendingTransfer}
          onClick={() => onRemove(memberId, nickname)}
          className={`flex min-w-fit items-center justify-center gap-1.5 rounded-content px-3 py-2 text-xs font-bold transition-colors ${
            canRemove
              ? "border border-danger/20 bg-danger/5 text-danger hover:bg-danger/10"
              : "cursor-not-allowed border border-border bg-sub-background text-text-muted"
          }`}
        >
          <DowinIcon name="action-member-remove" size="14px" />
          <span>{isPendingDelete ? t("processing") : t("remove")}</span>
        </Button>
      </div>
    </div>
  );
}
