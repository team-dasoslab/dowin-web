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
      className="flex flex-col justify-between gap-3 bg-white px-4 py-4 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
        <UserAvatar
          avatarKey={member.avatarKey}
          avatarSeed={member.nickname}
          alt={t("avatarAlt", { name: nickname })}
          size={40}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {nickname}
            </p>
            <Badge
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                member.role === "ADMIN"
                  ? "bg-primary/10 text-primary"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {member.role === "ADMIN" ? "ADMIN" : "MEMBER"}
            </Badge>
            {isSelf ? (
              <Badge className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                {t("me")}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-end gap-2 pl-[52px] sm:w-auto sm:pl-0 mt-1 sm:mt-0">
        {canTransferAdmin ? (
          <Button
            type="button"
            disabled={isPendingTransfer || isPendingDelete}
            onClick={() => onTransferAdmin(memberId, nickname)}
            className="flex min-w-fit items-center justify-center gap-1.5 rounded-[12px] bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
          >
            <DowinIcon name="status-locked" size="14px" />
            <span>{isPendingTransfer ? t("processing") : t("transferAdmin")}</span>
          </Button>
        ) : null}

        <Button
          type="button"
          disabled={!canRemove || isPendingDelete || isPendingTransfer}
          onClick={() => onRemove(memberId, nickname)}
          className={`flex min-w-fit items-center justify-center gap-1.5 rounded-[12px] px-3 py-2 text-xs font-bold transition-colors ${
            canRemove
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "cursor-not-allowed bg-zinc-100 text-zinc-400"
          }`}
        >
          <DowinIcon name="action-member-remove" size="14px" />
          <span>{isPendingDelete ? t("processing") : t("remove")}</span>
        </Button>
      </div>
    </div>
  );
}
