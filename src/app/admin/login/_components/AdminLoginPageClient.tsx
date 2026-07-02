"use client";

import { useAdminLoginForm } from "@/app/admin/login/_hooks/useAdminLoginForm";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function AdminLoginPageClient() {
  const {
    loginId,
    setLoginId,
    password,
    setPassword,
    error,
    isPending,
    handleSubmit,
  } = useAdminLoginForm();

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-sub-background px-4 py-12 overflow-y-auto selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>

      <Card
        className="w-full max-w-[480px] animate-dowin-in relative z-10"
        padding="xl"
      >
        <div className="flex flex-col items-start text-left space-y-5 mb-12">
          <Logo size="32px" className="text-text-primary" />
          <div className="space-y-1.5">
            <h1 className="text-[24px] font-black tracking-tighter text-text-primary leading-none">
              운영자 로그인
            </h1>
            <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
              운영 콘솔에 접속하려면 운영자 아이디와 비밀번호를 입력하세요.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-5">
            <Input
              label="운영자 아이디"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
            />

            <PasswordInput
              label="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-danger/5 border border-danger/10 rounded-content animate-shake">
              <p className="text-danger text-[12px] font-bold text-center leading-tight">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isPending}
              variant="hero"
              size="hero"
              className="w-full"
            >
              {isPending ? <InlineSpinner /> : <span>로그인</span>}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
