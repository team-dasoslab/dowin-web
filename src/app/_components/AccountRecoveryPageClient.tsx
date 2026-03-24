"use client";

import {
  usePostAuthRecoveryCodesVerify,
  usePutAuthPasswordByRecoveryCode,
} from "@/api/generated/auth/auth";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

const passwordSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9!@#$%^&*()\-_=+\[\]{}|:<>?,./~]{8,}$/,
    "비밀번호는 8자 이상의 영문/숫자/허용 특수문자 조합이어야 합니다.",
  );

export default function AccountRecoveryPageClient() {
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryAccount, setRecoveryAccount] = useState<{
    customId: string;
    nickname: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const verifyRecoveryCodeMutation = usePostAuthRecoveryCodesVerify();
  const resetPasswordByRecoveryCodeMutation = usePutAuthPasswordByRecoveryCode();
  const isPending =
    verifyRecoveryCodeMutation.isPending ||
    resetPasswordByRecoveryCodeMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!recoveryAccount) {
      try {
        const response = await verifyRecoveryCodeMutation.mutateAsync({
          data: {
            recoveryCode,
          },
        });

        if (response.status !== 200 || !response.data.user) {
          setError("복원코드를 확인해주세요.");
          return;
        }

        setRecoveryAccount(response.data.user);
        return;
      } catch (verifyError) {
        setError(getApiErrorMessage(verifyError, "복원코드를 확인해주세요."));
        return;
      }
    }

    const parsedPassword = passwordSchema.safeParse(newPassword);
    if (!parsedPassword.success) {
      setError("비밀번호는 8자 이상의 영문/숫자/허용 특수문자 조합이어야 합니다.");
      return;
    }

    try {
      const response = await resetPasswordByRecoveryCodeMutation.mutateAsync({
        data: {
          recoveryCode,
          newPassword,
        },
      });

      if (response.status !== 200) {
        setError("비밀번호 재설정에 실패했습니다.");
        return;
      }

      setNotice("비밀번호를 재설정했습니다. 로그인 화면으로 이동해주세요.");
      setRecoveryAccount(null);
      setRecoveryCode("");
      setNewPassword("");
    } catch (resetError) {
      setError(getApiErrorMessage(resetError, "비밀번호 재설정에 실패했습니다."));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-pretendard">
      <Card className="w-full max-w-[440px] bg-white border border-border rounded-2xl p-8 md:p-10 shadow-sm animate-linear-in">
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <KeyRound className="text-primary w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              계정 복구
            </h1>
            <p className="text-[13px] text-text-muted">
              복원코드로 계정을 조회하고 비밀번호를 재설정합니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">
              복원코드
            </label>
            <Input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="6JYS-B959TK"
              className="w-full px-4 py-3 bg-sub-background border border-border rounded-xl text-sm focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-text-muted/40 font-medium"
              required
              disabled={isPending || Boolean(recoveryAccount)}
            />
            <p className="text-[11px] text-text-muted">
              대소문자/하이픈/공백은 자동으로 정리됩니다.
            </p>
          </div>

          {recoveryAccount && (
            <>
              <div className="rounded-xl border border-border bg-sub-background p-3">
                <p className="text-[11px] text-text-muted">조회된 계정</p>
                <div className="mt-2 space-y-2">
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-muted">닉네임</p>
                    <Input
                      value={recoveryAccount.nickname}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-text-primary font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-text-muted">아이디</p>
                    <Input
                      value={recoveryAccount.customId}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-text-primary font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">
                  새 비밀번호
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-sub-background border border-border rounded-xl text-sm focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-text-muted/40 font-medium"
                  required
                  disabled={isPending}
                />
              </div>
            </>
          )}

          {notice && (
            <div className="p-3 bg-success/5 border border-success/20 rounded-xl">
              <p className="text-success text-[11px] font-bold text-center">
                {notice}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl">
              <p className="text-danger text-[11px] font-bold text-center">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className={`
              w-full py-3.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all
              ${
                isPending
                  ? "bg-primary/50 text-white cursor-not-allowed"
                  : "btn-linear-primary shadow-lg shadow-primary/10"
              }
            `}
          >
            {isPending ? (
              <InlineSpinner />
            ) : (
              <span>{recoveryAccount ? "비밀번호 재설정" : "계정 조회"}</span>
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/"
              className="text-xs font-medium text-text-muted hover:text-text-primary underline underline-offset-2"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
