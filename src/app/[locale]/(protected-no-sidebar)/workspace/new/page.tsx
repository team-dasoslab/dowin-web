"use client";

import { useCreateWorkspaceForm } from "@/app/[locale]/(protected-no-sidebar)/workspace/new/_hooks/useCreateWorkspaceForm";
import { useCreateWorkspaceMutation } from "@/app/[locale]/(protected-no-sidebar)/workspace/new/_hooks/useCreateWorkspaceMutation";
import { InlineSpinner } from "@/components/InlineSpinner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";
import { Link } from "@/i18n/routing";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

export default function NewWorkspacePage() {
  const t = useTranslations("Workspace.new");
  const tCommon = useTranslations("Common");
  const {
    error,
    getValidatedName,
    getValidatedSeatCount,
    getValidatedPromotionCode,
    name,
    seatCount,
    promotionCode,
    setError,
    handleNameChange,
    handleSeatCountChange,
    handlePromotionCodeChange,
  } = useCreateWorkspaceForm();
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

    let validatedSeatCount = 1;
    if (!promotionCode) {
      const seat = getValidatedSeatCount();
      if (seat === null) return;
      validatedSeatCount = seat;
    }

    const validatedPromotionCode = getValidatedPromotionCode();

    submitCreateWorkspace(validatedName, validatedSeatCount, validatedPromotionCode);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-zinc-50/50 px-4 py-12 overflow-y-auto selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>
      {isPending && (
        <LoadingOverlay message={promotionCode ? t("loadingPromo") : t("loading")} />
      )}
      <div className="w-full max-w-[480px] bg-white border-none rounded-[24px] p-8 md:p-12 space-y-10 animate-dowin-in relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* 상단 내비게이션 */}
        <div className="flex items-center">
          <SmartBackButton className="w-9 h-9 rounded-full bg-zinc-100 border-none flex items-center justify-center text-zinc-600 transition-transform active:scale-[0.98] shrink-0" />
        </div>

        {/* 헤더 */}
        <div className="space-y-5">
          <div className="w-16 h-16 bg-white border-none rounded-[16px] flex items-center justify-center shadow-sm">
            <Logo size="32px" className="text-text-primary" />
          </div>
          <div className="space-y-2">
            <InfoTooltip
              label={
                <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                  {t("title")}
                </h1>
              }
              content={t("description")}
            />
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            label={t("label")}
            type="text"
            value={name}
            disabled={isPending}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("placeholder")}
            autoFocus
            required
          />

          <div className="space-y-4">
            <label className="text-[11px] block font-black text-zinc-400 uppercase tracking-widest ml-1">
              {t("seatLabel")}
            </label>
            {promotionCode ? (
              <div className="flex h-[52px] w-full items-center rounded-[16px] border-none bg-zinc-100 px-5 text-[15px] font-semibold text-zinc-500 cursor-not-allowed">
                {t("seatAutoApplied") || "프로모션 혜택 최대 좌석 수로 자동 적용됩니다."}
              </div>
            ) : (
              <Input
                type="number"
                min={1}
                max={999}
                value={seatCount}
                disabled={isPending}
                onChange={(e) => handleSeatCountChange(e.target.value)}
                placeholder={t("seatPlaceholder")}
                required
              />
            )}
          </div>

          <div className="space-y-2">
            {!promotionCode ? (
              <button
                type="button"
                onClick={() => {
                  const code = window.prompt(t("promotionCodePlaceholder"));
                  if (code !== null) {
                    handlePromotionCodeChange(code.trim().toUpperCase());
                  }
                }}
                className="text-[13px] font-semibold text-primary hover:text-primary-light transition-colors"
              >
                프로모션 코드 등록
              </button>
            ) : (
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-[16px]">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-black text-primary block">적용된 프로모션 코드</span>
                  <span className="text-sm font-bold text-zinc-900">{promotionCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePromotionCodeChange("")}
                  className="text-[12px] font-bold text-zinc-400 hover:text-zinc-600 px-2 py-1"
                >
                  취소
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-danger/5 border border-danger/10 rounded-[16px]">
              <p className="text-danger text-[12px] font-bold text-center leading-tight">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending || !name.trim() || !seatCount.trim()}
            className={`
              h-[56px] w-full flex items-center justify-center gap-3 rounded-[24px] text-[16px] font-semibold transition-transform active:scale-[0.98]
              ${
                isPending || !name.trim() || !seatCount.trim()
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  : "bg-primary text-white"
              }
            `}
          >
            {isPending ? (
              <InlineSpinner size="sm" />
            ) : (
              <span>{promotionCode ? t("buttonPromo") : t("checkoutButton")}</span>
            )}
          </Button>
        </form>

        {/* 하단 링크 */}
        <div className="pt-4 flex items-center justify-center">
          <Link
            href="/workspace/join"
            className="text-[14px] font-semibold text-zinc-500 transition-colors active:text-zinc-800"
          >
            {t("goToJoinText")}
          </Link>
        </div>
      </div>
    </div>
  );
}
