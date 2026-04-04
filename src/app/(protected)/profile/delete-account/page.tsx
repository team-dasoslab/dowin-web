"use client";

import { useDeleteAccountAction } from "@/app/(protected)/profile/delete-account/_hooks/useDeleteAccountAction";
import { useDeleteAccountForm } from "@/app/(protected)/profile/delete-account/_hooks/useDeleteAccountForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { AlertTriangle } from "lucide-react";

export default function ProfileDeleteAccountPage() {
  const {
    confirmationText,
    currentPassword,
    setConfirmationText,
    setCurrentPassword,
    validate,
  } = useDeleteAccountForm();
  const { isSubmitting, submit } = useDeleteAccountAction({
    currentPassword,
    validate,
  });

  return (
    <div className="min-h-screen bg-background font-pretendard">
      <div className="mx-auto max-w-[560px] space-y-6 p-4 md:p-8 animate-linear-in">
        <header className="flex items-center justify-between">
          <SmartBackButton className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-[rgba(205,207,213,1)] hover:text-text-primary" />
          <p className="text-xs text-text-muted">서비스 탈퇴</p>
          <div className="w-8" />
        </header>

        <Card className="flex items-center gap-4 rounded-lg border border-red-200 bg-red-50/60 px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              서비스 탈퇴
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">
              현재 비밀번호를 확인한 뒤 계정과 연결된 데이터를 삭제합니다.
            </p>
          </div>
        </Card>

        <Card className="space-y-5 rounded-lg border border-border p-5">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            탈퇴하면 계정과 연결된 데이터는 복구할 수 없습니다. 워크스페이스의 마지막
            관리자라면 탈퇴할 수 없습니다.
          </div>

          <PasswordField
            label="현재 비밀번호"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="현재 비밀번호를 입력하세요"
          />

          <TextField
            label="확인 문구"
            value={confirmationText}
            onChange={setConfirmationText}
            placeholder="탈퇴합니다"
            hint="탈퇴를 진행하려면 탈퇴합니다를 그대로 입력하세요."
          />

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit()}
            className="h-11 w-full rounded-lg bg-red-600 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "탈퇴 처리 중..." : "서비스 탈퇴"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

type PasswordFieldProps = {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

function PasswordField({
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
        className="h-11 w-full rounded-lg border border-border bg-white px-3 pr-20 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-red-300"
        toggleClassName="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-semibold text-text-muted transition-colors hover:text-text-primary"
      />
    </label>
  );
}

type TextFieldProps = {
  hint?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

function TextField({
  hint,
  label,
  onChange,
  placeholder,
  value,
}: TextFieldProps) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
      </div>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-red-300"
      />
      {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
    </label>
  );
}
