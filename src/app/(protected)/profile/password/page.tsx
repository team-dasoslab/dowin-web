"use client";

import { usePasswordChangeAction } from "@/app/(protected)/profile/password/_hooks/usePasswordChangeAction";
import { usePasswordChangeForm } from "@/app/(protected)/profile/password/_hooks/usePasswordChangeForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { KeyRound } from "lucide-react";

export default function ProfilePasswordPage() {
  const {
    confirmPassword,
    currentPassword,
    newPassword,
    setConfirmPassword,
    setCurrentPassword,
    setNewPassword,
    validate,
  } = usePasswordChangeForm();
  const { isSubmitting, submit } = usePasswordChangeAction({
    currentPassword,
    newPassword,
    validate,
  });

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto max-w-[560px] space-y-6 p-4 md:p-8 animate-linear-in">
        <header className="flex items-center justify-between">
          <SmartBackButton className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-[rgba(205,207,213,1)] hover:text-text-primary" />
          <p className="text-xs text-text-muted">비밀번호 변경</p>
          <div className="w-8" />
        </header>

        <Card className="flex items-center gap-4 rounded-lg border border-border px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              비밀번호 변경
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
            </p>
          </div>
        </Card>

        <Card className="space-y-5 rounded-lg border border-border p-5">
          <PasswordField
            label="현재 비밀번호"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="현재 비밀번호를 입력하세요"
          />

          <PasswordField
            label="새 비밀번호"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="새 비밀번호를 입력하세요"
            hint="8자 이상의 영문, 숫자, 허용된 특수문자를 사용할 수 있어요."
          />

          <PasswordField
            label="새 비밀번호 확인"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="새 비밀번호를 한 번 더 입력하세요"
          />

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit()}
            className="btn-linear-primary h-11 w-full rounded-lg text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

type PasswordFieldProps = {
  hint?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

function PasswordField({
  hint,
  label,
  onChange,
  placeholder,
  value,
}: PasswordFieldProps) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
      </div>
      <PasswordInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-border bg-white px-3 pr-20 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary"
        toggleClassName="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-semibold text-text-muted transition-colors hover:text-text-primary"
      />
      {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
    </label>
  );
}
