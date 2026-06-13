"use client";

import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { useDeleteAccountAction } from "@/app/[locale]/(protected)/profile/delete-account/_hooks/useDeleteAccountAction";
import { useDeleteAccountForm } from "@/app/[locale]/(protected)/profile/delete-account/_hooks/useDeleteAccountForm";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
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
    <div className="min-h-screen">
      <ProtectedPageContainer className="max-w-[640px] pb-24 md:pb-10 lg:pb-12">
        <ProtectedPageHeader title={t("header")} />

        <div className="flex items-center gap-4 rounded-[24px] bg-white px-6 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-red-100 text-red-600">
            <DowinIcon name="status-warning" size="24px" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-bold tracking-tight text-zinc-900">
              {t("cardTitle")}
            </h1>
            <p className="mt-1 text-[13px] font-medium text-zinc-600 leading-relaxed">
              {t("cardDesc")}
            </p>
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
            className={`h-[56px] w-full flex items-center justify-center gap-3 rounded-[24px] text-[16px] font-semibold transition-transform ${
              isSubmitting
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 text-white hover:bg-zinc-800"
            }`}
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
    <PasswordInput
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="focus:ring-red-500/10"
    />
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
    <div className="space-y-1">
      <Input
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="focus:ring-red-500/10"
      />
      {hint ? <p className="text-[11px] text-zinc-500 pl-1">{hint}</p> : null}
    </div>
  );
}
