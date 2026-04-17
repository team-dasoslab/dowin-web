"use client";

import { usePasswordChangeAction } from "@/app/[locale]/(protected)/profile/password/_hooks/usePasswordChangeAction";
import { usePasswordChangeForm } from "@/app/[locale]/(protected)/profile/password/_hooks/usePasswordChangeForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ProfilePasswordPage() {
  const t = useTranslations("ProfilePassword");
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
          <p className="text-xs text-text-muted">{t("header")}</p>
          <div className="w-8" />
        </header>

        <Card className="flex items-center gap-4 rounded-lg border border-border px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              {t("cardTitle")}
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">{t("cardDesc")}</p>
          </div>
        </Card>

        <Card className="space-y-5 rounded-lg border border-border p-5">
          <PasswordField
            label={t("currentPasswordLabel")}
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder={t("currentPasswordPlaceholder")}
          />

          <PasswordField
            label={t("newPasswordLabel")}
            value={newPassword}
            onChange={setNewPassword}
            placeholder={t("newPasswordPlaceholder")}
            hint={t("newPasswordHint")}
          />

          <PasswordField
            label={t("confirmPasswordLabel")}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t("confirmPasswordPlaceholder")}
          />

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit()}
            className="btn-linear-primary h-11 w-full rounded-lg text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("submittingButton") : t("submitButton")}
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
