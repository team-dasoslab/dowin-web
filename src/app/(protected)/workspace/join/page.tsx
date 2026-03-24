"use client";

import {
  getGetWorkspacesMeQueryKey,
  usePostWorkspacesJoinByInvite,
} from "@/api/generated/workspace/workspace";
import { InlineSpinner } from "@/components/InlineSpinner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const joinByInviteSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "초대코드를 입력해주세요.")
    .max(32, "초대코드는 32자 이하여야 합니다."),
});

export default function JoinWorkspacePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { mutate: joinByInvite, isPending } = usePostWorkspacesJoinByInvite({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getGetWorkspacesMeQueryKey(),
        });
        showToast("success", "워크스페이스에 참가했습니다.");
        router.push("/dashboard/my");
      },
      onError: (joinError) => {
        const message = getApiErrorMessage(
          joinError,
          "워크스페이스 참가 중 오류가 발생했습니다.",
        );
        setError(message);
        showToast("error", message);
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = joinByInviteSchema.safeParse({ code: inviteCode });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "초대코드를 확인해주세요.");
      return;
    }

    setError("");
    joinByInvite({
      data: {
        code: parsed.data.code.toUpperCase(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-6">
      {isPending && <LoadingOverlay message="워크스페이스에 참가하는 중입니다." />}
      <div className="w-full max-w-[400px] space-y-8 animate-linear-in">
        <div className="flex items-center gap-3">
          <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors shrink-0" />
          <span className="text-xs font-bold text-text-muted">뒤로 가기</span>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Zap className="text-primary w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              초대코드로 참가하기
            </h1>
            <p className="text-xs text-text-muted leading-relaxed">
              팀 관리자에게 전달받은 초대코드를 입력하세요.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[11px] block font-bold text-text-secondary ml-0.5">
              초대코드
            </label>
            <Input
              type="text"
              value={inviteCode}
              disabled={isPending}
              onChange={(e) => {
                setInviteCode(e.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="예: TEAM-AB12-CD34"
              autoFocus
              className="w-full px-4 py-3 bg-sub-background border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors placeholder:text-text-muted/40"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg">
              <p className="text-danger text-[11px] font-bold text-center">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              asChild
              disabled={isPending}
              className="w-full rounded-lg border border-border bg-white py-3 text-sm font-bold text-text-primary hover:border-[rgba(205,207,213,1)]"
            >
              <Link href="/workspace/new" className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                새로 만들기
              </Link>
            </Button>

            <Button
              type="submit"
              disabled={isPending || inviteCode.trim().length === 0}
              className={`w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                isPending || inviteCode.trim().length === 0
                  ? "bg-primary/50 text-white cursor-not-allowed"
                  : "btn-linear-primary"
              }`}
            >
              {isPending ? (
                <InlineSpinner size="sm" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  참가하기
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
