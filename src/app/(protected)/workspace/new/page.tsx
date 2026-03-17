"use client";

import { usePostWorkspaces } from "@/api/generated/workspace/workspace";
import { InlineSpinner } from "@/components/InlineSpinner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { Plus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type WorkspaceCreateError = {
  data?: {
    message?: string;
  };
};

export default function NewWorkspacePage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const { mutate: createWorkspace, isPending } = usePostWorkspaces({
    mutation: {
      onSuccess: () => {
        router.push("/dashboard/my");
      },
      onError: (err: WorkspaceCreateError) => {
        setError(
          err.data?.message || "워크스페이스 생성 중 오류가 발생했습니다.",
        );
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createWorkspace({
      data: { name: name.trim() },
    });
  };

  return (
    <div className="min-h-screen bg-background font-pretendard flex items-center justify-center p-6">
      {isPending && <LoadingOverlay message="워크스페이스를 만드는 중입니다." />}
      <div className="w-full max-w-[400px] space-y-8 animate-linear-in">
        {/* 상단 내비게이션 */}
        <div className="flex items-center gap-3">
          <SmartBackButton className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-[rgba(205,207,213,1)] hover:text-text-primary transition-colors shrink-0" />
          <span className="text-xs font-bold text-text-muted">뒤로 가기</span>
        </div>

        {/* 헤더 */}
        <div className="space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Zap className="text-primary w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              새 워크스페이스 만들기
            </h1>
            <p className="text-xs text-text-muted leading-relaxed">
              워크스페이스는 팀의 목표를 함께 관리하는 공간입니다.
              <br />
              멋진 이름을 지어주세요.
            </p>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[11px] block font-bold text-text-secondary ml-0.5">
              워크스페이스 이름
            </label>
            <Input
              type="text"
              value={name}
              disabled={isPending}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 마케팅 팀, WIG 프로젝트"
              autoFocus
              className="w-full px-4 py-3 bg-sub-background border border-border rounded-lg text-sm focus:border-primary outline-none transition-colors placeholder:text-text-muted/40"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg">
              <p className="text-danger text-[11px] font-bold text-center">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending || !name.trim()}
            className={`
              w-full py-3 flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all
              ${
                isPending || !name.trim()
                  ? "bg-primary/50 text-white cursor-not-allowed"
                  : "btn-linear-primary shadow-sm"
              }
            `}
          >
            {isPending ? (
              <InlineSpinner size="sm" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>워크스페이스 생성하기</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
