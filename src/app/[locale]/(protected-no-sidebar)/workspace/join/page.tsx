"use client";

import { useJoinWorkspaceForm } from "@/app/[locale]/(protected-no-sidebar)/workspace/join/_hooks/useJoinWorkspaceForm";
import { useJoinWorkspaceMutation } from "@/app/[locale]/(protected-no-sidebar)/workspace/join/_hooks/useJoinWorkspaceMutation";
import { InlineSpinner } from "@/components/InlineSpinner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { SmartBackButton } from "@/components/ui/SmartBackButton";

import { useTranslations } from "next-intl";

export default function JoinWorkspacePage() {
  const t = useTranslations("Workspace.join");
  const { isPending, submitJoinWorkspace } = useJoinWorkspaceMutation({
    onError: (message) => {
      setError(message);
    },
  });
  const { error, inviteCode, setError, handleInviteCodeChange, handleSubmit } =
    useJoinWorkspaceForm({
      onSubmitCode: submitJoinWorkspace,
    });

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-y-auto selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>
      {isPending && <LoadingOverlay message={t("loading")} />}
      <div className="w-full max-w-[480px] bg-surface border-none rounded-[24px] p-8 md:p-12 space-y-10 animate-dowin-in relative z-10">
        <div className="flex items-center">
          <SmartBackButton className="w-9 h-9 rounded-full bg-sub-background border-none flex items-center justify-center text-text-secondary transition-transform shrink-0" />
        </div>

        <div className="space-y-5">
          <div className="w-16 h-16 bg-surface dark:bg-surface-elevated ring-1 ring-black/5 dark:ring-white/10 rounded-[16px] flex items-center justify-center shadow-sm">
            <Logo size="32px" className="text-text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">
              {t("title")}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            label={t("label")}
            type="text"
            value={inviteCode}
            disabled={isPending}
            onChange={(e) => handleInviteCodeChange(e.target.value)}
            placeholder={t("placeholder")}
            autoFocus
            required
          />

          {error && (
            <div className="p-4 bg-danger/5 border border-danger/10 rounded-[16px]">
              <p className="text-danger text-[12px] font-bold text-center leading-tight">
                {error}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button
              type="submit"
              disabled={isPending || inviteCode.trim().length === 0}
              variant="hero"
              size="hero"
              className="w-full"
            >
              {isPending ? <InlineSpinner size="sm" /> : t("button")}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
