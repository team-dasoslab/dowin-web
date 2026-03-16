"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { usePostAuthLogin } from "@/api/generated/auth/auth";
import { InlineSpinner } from "@/components/InlineSpinner";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { LogIn, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPageClient() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const loginMutation = usePostAuthLogin();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await loginMutation.mutateAsync({
        data: {
          customId: id,
          password: pw,
        },
      });

      if (response.status !== 200 || !response.data.user) {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      const nextPath = searchParams.get("next");
      router.push(nextPath || "/dashboard/my");
    } catch (loginError) {
      setError(
        getApiErrorMessage(loginError, "아이디 또는 비밀번호가 올바르지 않습니다."),
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-pretendard">
      <Card className="w-full max-w-[380px] bg-white border border-border rounded-2xl p-8 md:p-10 shadow-sm animate-linear-in">
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Zap className="text-primary w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              WIG
            </h1>
            <p className="text-[13px] text-text-muted">
              가장 중요한 목표에 집중하세요.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">
                아이디
              </label>
              <Input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 bg-sub-background border border-border rounded-xl text-sm focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-text-muted/40 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">
                비밀번호
              </label>
              <Input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-sub-background border border-border rounded-xl text-sm focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-text-muted/40 font-medium"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl">
              <p className="text-danger text-[11px] font-bold text-center">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className={`
              w-full py-3.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all
              ${
                loginMutation.isPending
                  ? "bg-primary/50 text-white cursor-not-allowed"
                  : "btn-linear-primary shadow-lg shadow-primary/10"
              }
            `}
          >
            {loginMutation.isPending ? (
              <InlineSpinner />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>시작하기</span>
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
