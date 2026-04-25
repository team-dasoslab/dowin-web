"use client";

import { usePasswordChangeAction } from "@/app/[locale]/(protected)/profile/password/_hooks/usePasswordChangeAction";
import { usePasswordChangeForm } from "@/app/[locale]/(protected)/profile/password/_hooks/usePasswordChangeForm";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { DowinIcon } from "@/components/ui/DowinIcon";
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
    <div className="min-h-screen bg-slate-50/50 font-pretendard">
      <ProtectedPageContainer>
        <ProtectedPageHeader title={t("header")} />

        <Card className="flex items-center gap-4 rounded-content border border-border px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-content bg-primary/10 text-primary">
            <DowinIcon name="domain-key" size="20px" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              {t("cardTitle")}
            </h1>
            <p className="mt-0.5 text-xs text-text-muted">{t("cardDesc")}</p>
          </div>
        </Card>

        <Card className="space-y-5 rounded-content border border-border p-5">
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
            className="btn-dowin-primary h-11 w-full rounded-content text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("submittingButton") : t("submitButton")}
          </Button>
        </Card>
      </ProtectedPageContainer>
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
        className="h-11 w-full rounded-content border border-border bg-white px-3 pr-20 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary"
        toggleClassName="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-semibold text-text-muted transition-colors hover:text-text-primary"
      />
      {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
    </label>
  );
}
