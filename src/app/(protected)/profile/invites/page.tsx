"use client";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import {
  getGetWorkspacesIdInvitesQueryKey,
  useGetWorkspacesIdInvites,
  useGetWorkspacesMe,
  usePatchWorkspacesIdInvitesInviteIdStatus,
  usePostWorkspacesIdInvites,
} from "@/api/generated/workspace/workspace";
import { NoWorkspaceActions } from "@/app/(protected)/_components/NoWorkspaceActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Shield, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";

const createInviteSchema = z.object({
  maxUses: z
    .number()
    .int("사용 횟수는 정수여야 합니다.")
    .min(1, "사용 횟수는 1 이상이어야 합니다.")
    .max(999, "사용 횟수는 999 이하여야 합니다."),
});

function InvitePageSkeleton() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto max-w-[720px] animate-pulse space-y-6 p-4 md:p-8">
        <div className="h-10 rounded-xl bg-sub-background" />
        <div className="h-24 rounded-2xl bg-sub-background" />
        <div className="h-44 rounded-2xl bg-sub-background" />
        <div className="h-72 rounded-2xl bg-sub-background" />
      </div>
    </div>
  );
}

function NoWorkspaceState() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-4 rounded-lg border border-border p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-text-primary">
              워크스페이스가 없어요
            </h1>
            <p className="text-sm text-text-muted">
              초대코드 관리는 워크스페이스를 만든 뒤 사용할 수 있습니다.
            </p>
          </div>
          <div className="flex justify-center">
            <NoWorkspaceActions />
          </div>
        </Card>
      </div>
    </div>
  );
}

function NoAccessState() {
  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto flex min-h-screen max-w-[560px] items-center p-4 md:p-8">
        <Card className="w-full space-y-4 rounded-lg border border-border p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-text-primary">
              관리자만 접근할 수 있어요
            </h1>
            <p className="text-sm text-text-muted">
              초대코드 생성/상태 변경은 현재 워크스페이스의 관리자만 할 수 있습니다.
            </p>
          </div>
          <Button asChild className="w-full rounded-lg border border-border bg-white py-3 text-sm font-semibold text-text-primary">
            <Link href="/profile">설정으로 돌아가기</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}

export default function ProfileInvitesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [maxUsesInput, setMaxUsesInput] = useState("3");
  const [formError, setFormError] = useState("");
  const [copiedInviteId, setCopiedInviteId] = useState<number | null>(null);
  const [pendingToggleInviteId, setPendingToggleInviteId] = useState<number | null>(null);

  const { data: profileResponse, isLoading: isProfileLoading } = useGetUsersMe();
  const {
    data: workspaceResponse,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
  } = useGetWorkspacesMe({
    query: {
      retry: (failureCount, error) =>
        getApiErrorStatus(error) !== 404 && failureCount < 2,
    },
  });

  const user = profileResponse?.status === 200 ? profileResponse.data : null;
  const workspace = workspaceResponse?.status === 200 ? workspaceResponse.data : null;
  const workspaceId = workspace?.id ?? 0;
  const isWorkspaceAdmin = user?.role === "ADMIN";

  const {
    data: invitesResponse,
    isLoading: isInvitesLoading,
  } = useGetWorkspacesIdInvites(workspaceId, {
    query: {
      enabled: workspaceId > 0 && isWorkspaceAdmin,
      retry: false,
    },
  });

  const createInviteMutation = usePostWorkspacesIdInvites();
  const updateInviteStatusMutation = usePatchWorkspacesIdInvitesInviteIdStatus();

  const invites = useMemo(() => {
    if (invitesResponse?.status !== 200) {
      return [];
    }

    return [...invitesResponse.data].sort((left, right) => (right.id ?? 0) - (left.id ?? 0));
  }, [invitesResponse]);

  const hasNoWorkspace = getApiErrorStatus(workspaceError) === 404;
  const isLoading =
    isProfileLoading ||
    isWorkspaceLoading ||
    (isWorkspaceAdmin && isInvitesLoading);

  const activeInviteCount = invites.filter((invite) => invite.status === "ACTIVE").length;

  const invalidateInviteQueries = async () => {
    await queryClient.invalidateQueries({
      queryKey: getGetWorkspacesIdInvitesQueryKey(workspaceId),
    });
  };

  const handleCreateInvite = async () => {
    const parsed = createInviteSchema.safeParse({ maxUses: Number(maxUsesInput) });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.");
      return;
    }

    try {
      setFormError("");
      const response = await createInviteMutation.mutateAsync({
        id: workspaceId,
        data: { maxUses: parsed.data.maxUses },
      });

      if (response.status !== 201) {
        throw response;
      }

      await invalidateInviteQueries();
      showToast("success", "초대코드를 생성했습니다.");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "초대코드 생성에 실패했습니다."),
      );
    }
  };

  const handleToggleInviteStatus = async (
    inviteId: number,
    nextStatus: "ACTIVE" | "INACTIVE",
  ) => {
    try {
      setPendingToggleInviteId(inviteId);
      const response = await updateInviteStatusMutation.mutateAsync({
        id: workspaceId,
        inviteId,
        data: { status: nextStatus },
      });

      if (response.status !== 200) {
        throw response;
      }

      await invalidateInviteQueries();
      showToast(
        "success",
        nextStatus === "ACTIVE"
          ? "초대코드를 활성화했습니다."
          : "초대코드를 비활성화했습니다.",
      );
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "초대코드 상태 변경에 실패했습니다."),
      );
    } finally {
      setPendingToggleInviteId(null);
    }
  };

  const handleCopyInviteCode = async (inviteId: number, code?: string) => {
    if (!code) {
      showToast("error", "복사할 코드가 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopiedInviteId(inviteId);
      showToast("success", "초대코드를 복사했습니다.");
      setTimeout(() => {
        setCopiedInviteId((current) => (current === inviteId ? null : current));
      }, 1200);
    } catch {
      showToast("error", "클립보드 복사에 실패했습니다.");
    }
  };

  if (isLoading) {
    return <InvitePageSkeleton />;
  }

  if (hasNoWorkspace) {
    return <NoWorkspaceState />;
  }

  if (!user || !workspace || !isWorkspaceAdmin) {
    return <NoAccessState />;
  }

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto max-w-[720px] space-y-6 p-4 md:p-8 animate-linear-in">
        <header className="flex items-center justify-between">
          <SmartBackButton className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-[rgba(205,207,213,1)] hover:text-text-primary" />
          <p className="text-xs text-text-muted">초대코드 관리</p>
          <div className="w-8" />
        </header>

        <Card className="flex items-center gap-4 rounded-lg border border-border px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Ticket className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              {workspace.name}
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              전체 {invites.length}개 코드, 현재 활성 {activeInviteCount}개
            </p>
          </div>
        </Card>

        <Card className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">새 초대코드 만들기</h2>
            <p className="text-[11px] text-text-muted">
              멤버가 사용할 수 있는 최대 횟수를 정하고 초대코드를 발급합니다.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-text-secondary">최대 사용 횟수</p>
              <p className="text-[11px] text-text-muted">최대 999개까지 설정 가능</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs text-text-secondary">
                <span className="shrink-0 text-[11px]">사용 횟수</span>
                <Input
                  id="max-uses"
                  type="number"
                  min={1}
                  max={999}
                  value={maxUsesInput}
                  onChange={(event) => {
                    setMaxUsesInput(event.target.value);
                    if (formError) {
                      setFormError("");
                    }
                  }}
                  placeholder="3"
                  className="h-full min-w-0 border-0 bg-transparent p-0 text-right text-sm font-semibold text-text-primary outline-none focus-visible:ring-0"
                />
                <span className="shrink-0 text-[11px] text-text-muted">회</span>
              </label>

              <Button
                type="button"
                onClick={() => void handleCreateInvite()}
                disabled={createInviteMutation.isPending}
                className={`h-11 rounded-lg px-4 text-xs font-bold ${
                  createInviteMutation.isPending
                    ? "cursor-not-allowed border border-border bg-sub-background text-text-muted"
                    : "btn-linear-primary"
                }`}
              >
                {createInviteMutation.isPending ? "생성 중..." : "초대코드 생성"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[1, 3, 5, 10].map((value) => (
                <Button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMaxUsesInput(String(value));
                    if (formError) {
                      setFormError("");
                    }
                  }}
                  className={`h-7 rounded-full px-2.5 text-[11px] font-bold ${
                    Number(maxUsesInput) === value
                      ? "border border-primary/20 bg-primary/10 text-primary"
                      : "border border-border bg-white text-text-muted"
                  }`}
                >
                  {value}회
                </Button>
              ))}
            </div>

            {formError ? <p className="text-[11px] text-danger">{formError}</p> : null}
          </div>
        </Card>

        <Card className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text-primary">초대코드 목록</h2>
            <p className="text-[11px] text-text-muted">
              코드 복사와 활성/비활성 상태를 관리할 수 있습니다.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            {invites.length === 0 ? (
              <div className="bg-white px-4 py-10 text-center text-sm text-text-muted">
                아직 생성된 초대코드가 없습니다.
              </div>
            ) : (
              invites.map((invite, index) => {
                const inviteId = invite.id ?? 0;
                const code = invite.code ?? "";
                const isActive = invite.status === "ACTIVE";
                const isPendingToggle = pendingToggleInviteId === inviteId;
                const isCopied = copiedInviteId === inviteId;
                const usageLabel = `${invite.usedCount ?? 0} / ${invite.maxUses ?? 0}`;

                return (
                  <div
                    key={inviteId > 0 ? inviteId : `${code}-${index}`}
                    className={`space-y-3 bg-white px-4 py-3 ${
                      index < invites.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate font-mono text-sm font-bold tracking-wide text-text-primary">
                          {code || "코드 없음"}
                        </p>
                        <Badge
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "border border-border bg-white text-text-secondary"
                          }`}
                        >
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => void handleCopyInviteCode(inviteId, code)}
                          className="h-8 rounded-lg border border-border bg-white px-2.5 text-[11px] font-bold text-text-primary"
                        >
                          {isCopied ? (
                            <span className="flex items-center gap-1.5">
                              <Check className="h-3.5 w-3.5" /> 복사 완료
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Copy className="h-3.5 w-3.5" /> 코드 복사
                            </span>
                          )}
                        </Button>

                        <button
                          type="button"
                          disabled={inviteId <= 0 || isPendingToggle}
                          aria-label={
                            isActive
                              ? "초대코드 비활성화"
                              : "초대코드 활성화"
                          }
                          onClick={() =>
                            void handleToggleInviteStatus(
                              inviteId,
                              isActive ? "INACTIVE" : "ACTIVE",
                            )
                          }
                          className={`relative inline-flex h-[22px] w-[42px] flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out ${
                            inviteId <= 0 || isPendingToggle
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer"
                          } ${isActive ? "bg-primary" : "bg-border"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ${
                              isActive ? "translate-x-[20px]" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2">
                      <span className="text-[10px] font-bold tracking-wide text-text-muted">
                        사용량 {usageLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
