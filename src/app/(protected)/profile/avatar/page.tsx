"use client";

import { getGetDashboardTeamQueryKey } from "@/api/generated/dashboard/dashboard";
import {
  getGetUsersMeQueryKey,
  useGetUsersMe,
  usePutUsersMe,
} from "@/api/generated/profile/profile";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useToast } from "@/context/ToastContext";
import { PROFILE_AVATAR_KEYS } from "@/domain/profile/avatar-options";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function AvatarPageSkeleton() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto max-w-[560px] animate-pulse space-y-6 p-4 md:p-8">
        <div className="h-10 rounded-xl bg-sub-background" />
        <div className="h-24 rounded-2xl bg-sub-background" />
        <div className="h-72 rounded-2xl bg-sub-background" />
      </div>
    </div>
  );
}

export default function ProfileAvatarPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { data: profileResponse, isLoading } = useGetUsersMe();
  const updateProfileMutation = usePutUsersMe();

  const user = profileResponse?.status === 200 ? profileResponse.data : null;

  if (isLoading) {
    return <AvatarPageSkeleton />;
  }

  if (!user) {
    return null;
  }

  const nickname = user.nickname ?? "사용자";
  const avatarKey = user.avatarKey ?? null;

  const handleAvatarSelect = async (nextAvatarKey: string | null) => {
    if (avatarKey === nextAvatarKey) {
      return;
    }

    if (!confirm("프로필 아이콘을 변경할까요?")) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await updateProfileMutation.mutateAsync({
        data: {
          avatarKey: nextAvatarKey,
        },
      });

      if (response.status !== 200) {
        throw response;
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetUsersMeQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardTeamQueryKey(undefined),
        }),
      ]);
      showToast("success", "프로필 아이콘이 변경되었습니다.");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "프로필 아이콘 변경에 실패했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-pretendard">
      {isSaving ? (
        <LoadingOverlay variant="ios" message="프로필 아이콘을 변경하는 중입니다." />
      ) : null}
      <div className="mx-auto max-w-[560px] space-y-6 p-4 md:p-8 animate-linear-in">
        <header className="flex items-center justify-between">
          <SmartBackButton className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-[rgba(205,207,213,1)] hover:text-text-primary" />
          <p className="text-xs text-text-muted">프로필 아이콘</p>
          <div className="w-8" />
        </header>

        <Card className="flex items-center gap-4 rounded-lg border border-border px-6 py-5">
          <UserAvatar
            avatarKey={avatarKey}
            alt={`${nickname} 아바타`}
            size={48}
            className="flex-shrink-0"
            fallbackClassName="rounded-lg"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              {nickname}
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              팀 대시보드에도 같은 이미지가 표시됩니다.
            </p>
          </div>
        </Card>

        <Card className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">아이콘 선택</h2>
            <p className="text-[11px] text-text-muted">
              귀여운 정적 이미지를 골라 프로필에 적용합니다.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <Button
              type="button"
              onClick={() => void handleAvatarSelect(null)}
              disabled={isSaving}
              className={`col-span-1 flex h-14 items-center justify-center rounded-lg border bg-white ${
                avatarKey === null
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-[rgba(205,207,213,1)]"
              }`}
            >
              <UserAvatar
                avatarKey={null}
                alt="기본 아이콘"
                size={32}
                fallbackClassName="rounded-md"
              />
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PROFILE_AVATAR_KEYS.map((option) => (
              <Button
                key={option}
                type="button"
                onClick={() => void handleAvatarSelect(option)}
                disabled={isSaving}
                className={`flex h-14 items-center justify-center rounded-lg border bg-white ${
                  avatarKey === option
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-[rgba(205,207,213,1)]"
                }`}
              >
                <UserAvatar
                  avatarKey={option}
                  alt={`${option} 아바타`}
                  size={32}
                />
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
