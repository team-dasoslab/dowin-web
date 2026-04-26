"use client";

import { useCreateWorkspaceForm } from "@/app/[locale]/(protected)/workspace/new/_hooks/useCreateWorkspaceForm";
import { useCreateWorkspaceMutation } from "@/app/[locale]/(protected)/workspace/new/_hooks/useCreateWorkspaceMutation";
import { InlineSpinner } from "@/components/InlineSpinner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useTranslations } from "next-intl";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Logo } from "@/components/ui/Logo";

export default function NewWorkspacePage() {
  const t = useTranslations("Workspace.new");
  const tCommon = useTranslations("Common");
  const { error, getValidatedName, name, setError, handleNameChange } =
    useCreateWorkspaceForm();
  const { isPending, submitCreateWorkspace } = useCreateWorkspaceMutation({
    onError: (message) => {
      setError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validatedName = getValidatedName();
    if (!validatedName) {
      return;
    }

    submitCreateWorkspace(validatedName);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      {isPending && (
        <LoadingOverlay message={t("loading")} />
      )}
      <div className="w-full max-w-[420px] bg-white border border-zinc-200 rounded-content p-8 md:p-10 space-y-10 animate-dowin-in">
        {/* 상단 내비게이션 */}
        <div className="flex items-center gap-3">
          <SmartBackButton className="w-8 h-8 rounded-button border border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors shrink-0" />
          <span className="text-xs font-bold text-zinc-400">{tCommon("back")}</span>
        </div>

        {/* 헤더 */}
        <div className="space-y-5">
          <div className="w-12 h-12 bg-primary/10 rounded-content flex items-center justify-center">
            <Logo size="24px" className="text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed whitespace-pre-line">
              {t("description")}
            </p>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="text-[11px] block font-black text-zinc-400 uppercase tracking-widest ml-1">
              {t("label")}
            </label>
            <Input
              type="text"
              value={name}
              disabled={isPending}
              onChange={(e) => handleNameChange(e.target.value)}
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

          <Button
            type="submit"
            disabled={isPending || !name.trim()}
            className={`
              w-full py-4 flex items-center justify-center gap-2 rounded-button text-sm font-black transition-all
              ${
                isPending || !name.trim()
                  ? "bg-primary/50 text-white cursor-not-allowed"
                  : "btn-dowin-primary hover:scale-[1.02] active:scale-[0.98]"
              }
            `}
          >
            {isPending ? (
              <InlineSpinner size="sm" />
            ) : (
              <>
                <DowinIcon name="action-add" size="16px" />
                <span>{t("button")}</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
