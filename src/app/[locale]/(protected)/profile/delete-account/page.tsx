"use client";

import { useDeleteAccountAction } from "@/app/[locale]/(protected)/profile/delete-account/_hooks/useDeleteAccountAction";
import { useDeleteAccountForm } from "@/app/[locale]/(protected)/profile/delete-account/_hooks/useDeleteAccountForm";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useTranslations } from "next-intl";

export default function ProfileDeleteAccountPage() {
  const t = useTranslations("ProfileDeleteAccount");
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
    <div className="min-h-screen bg-zinc-100">
      <ProtectedPageContainer className="max-w-[640px]">
        <ProtectedPageHeader title={t("header")} />

        <div className="flex items-center gap-4 rounded-[24px] bg-white px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-red-100 text-red-600">
            <DowinIcon name="status-warning" size="24px" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-bold tracking-tight text-zinc-900">
              {t("cardTitle")}
            </h1>
            <p className="mt-1 text-[13px] font-medium text-zinc-600 leading-relaxed">{t("cardDesc")}</p>
          </div>
        </div>

        <div className="space-y-5 rounded-[24px] bg-white p-5">
          <div className="rounded-[16px] bg-red-50 px-4 py-3 text-sm text-red-700">
            {t("warningText")}
          </div>

          <PasswordField
            label={t("currentPasswordLabel")}
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder={t("currentPasswordPlaceholder")}
          />

          <TextField
            label={t("confirmationTextLabel")}
            value={confirmationText}
            onChange={setConfirmationText}
            placeholder={t("confirmationTextPlaceholder")}
            hint={t("confirmationTextHint")}
          />

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit()}
            className="h-11 w-full rounded-[12px] bg-red-600 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("submittingButton") : t("submitButton")}
          </Button>
        </div>
      </ProtectedPageContainer>
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
        className="h-11 w-full rounded-[12px] border-none bg-zinc-100 px-3 pr-20 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
        toggleClassName="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-semibold text-text-muted transition-colors"
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
        className="h-11 w-full rounded-[12px] border-none bg-zinc-100 px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
      />
      {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
    </label>
  );
}
