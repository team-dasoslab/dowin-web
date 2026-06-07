"use client";

import { usePasswordChangeAction } from "@/app/[locale]/(protected)/profile/password/_hooks/usePasswordChangeAction";
import { usePasswordChangeForm } from "@/app/[locale]/(protected)/profile/password/_hooks/usePasswordChangeForm";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { Button } from "@/components/ui/Button";
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
    <div className="min-h-screen bg-zinc-100">
      <ProtectedPageContainer className="max-w-[640px]">
        <ProtectedPageHeader title={t("header")} />

        <div className="flex items-center gap-4 rounded-[24px] bg-white px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
            <DowinIcon name="domain-key" size="24px" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-bold tracking-tight text-zinc-900">
              {t("cardTitle")}
            </h1>
            <p className="mt-1 text-[13px] font-medium text-zinc-500 leading-relaxed">{t("cardDesc")}</p>
          </div>
        </div>

        <div className="space-y-5 rounded-[24px] bg-white p-5">
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
            className="btn-dowin-primary h-11 w-full rounded-[12px] text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("submittingButton") : t("submitButton")}
          </Button>
        </div>
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
    <div className="space-y-1">
      <PasswordInput
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {hint ? <p className="text-[11px] text-zinc-500 pl-1">{hint}</p> : null}
    </div>
  );
}
