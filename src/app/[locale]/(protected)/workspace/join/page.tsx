"use client";

import { useJoinWorkspaceForm } from "@/app/[locale]/(protected)/workspace/join/_hooks/useJoinWorkspaceForm";
import { useJoinWorkspaceMutation } from "@/app/[locale]/(protected)/workspace/join/_hooks/useJoinWorkspaceMutation";
import { InlineSpinner } from "@/components/InlineSpinner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { Link } from "@/i18n/routing";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";
import { useTranslations } from "next-intl";

export default function JoinWorkspacePage() {
  const t = useTranslations("Workspace.join");
  const tCommon = useTranslations("Common");
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
    <div className="min-h-screen bg-[#F8FAFC] font-pretendard flex items-center justify-center p-4">
      {isPending && <LoadingOverlay message={t("loading")} />}
      <div className="w-full max-w-[420px] bg-white border border-zinc-200 rounded-content p-8 md:p-10 space-y-10 animate-dowin-in">
        <div className="flex items-center gap-3">
          <SmartBackButton className="w-8 h-8 rounded-button border border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors shrink-0" />
          <span className="text-xs font-bold text-zinc-400">
            {tCommon("back")}
          </span>
        </div>

        <div className="space-y-5">
          <div className="w-12 h-12 bg-primary/10 rounded-content flex items-center justify-center">
            <Logo size="24px" className="text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              {t("description")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="text-[11px] block font-black text-zinc-400 uppercase tracking-widest ml-1">
              {t("label")}
            </label>
            <Input
              type="text"
              value={inviteCode}
              disabled={isPending}
              onChange={(e) => handleInviteCodeChange(e.target.value)}
              placeholder={t("placeholder")}
              autoFocus
              className="w-full px-5 py-4 bg-zinc-50/50 border border-zinc-200 rounded-content text-base focus:border-primary outline-none transition-all placeholder:text-zinc-300"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-content">
              <p className="text-red-600 text-xs font-bold text-center">
                {error}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button
              type="submit"
              disabled={isPending || inviteCode.trim().length === 0}
              className={`w-full py-4 rounded-button text-sm font-black transition-all flex items-center justify-center gap-2 ${
                isPending || inviteCode.trim().length === 0
                  ? "bg-primary/50 text-white cursor-not-allowed"
                  : "btn-dowin-primary hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isPending ? (
                <InlineSpinner size="sm" />
              ) : (
                <>
                  <DowinIcon name="action-join" size="16px" />
                  {t("button")}
                </>
              )}
            </Button>

            <Button
              asChild
              disabled={isPending}
              className="w-full rounded-button border border-zinc-200 bg-white py-4 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <Link
                href="/workspace/new"
                className="flex items-center justify-center gap-2"
              >
                <DowinIcon name="domain-people" size="16px" />
                {t("createButton")}
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
