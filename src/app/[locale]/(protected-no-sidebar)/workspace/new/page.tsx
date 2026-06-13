"use client";

import { useCreateWorkspaceForm } from "@/app/[locale]/(protected-no-sidebar)/workspace/new/_hooks/useCreateWorkspaceForm";
import { useCreateWorkspaceMutation } from "@/app/[locale]/(protected-no-sidebar)/workspace/new/_hooks/useCreateWorkspaceMutation";
import { InlineSpinner } from "@/components/InlineSpinner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/Button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function NewWorkspacePage() {
 const t = useTranslations("Workspace.new");
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
 <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-y-auto selection:bg-primary/20">
 <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]"></div>
 {isPending && (
 <LoadingOverlay message={promotionCode ? t("loadingPromo") : t("loading")} />
 )}
 <div className="w-full max-w-[480px] bg-surface border-none rounded-[24px] p-8 md:p-12 space-y-10 animate-dowin-in relative z-10">
 {/* 상단 내비게이션 */}
 <div className="flex items-center">
 <SmartBackButton />
 </div>

 {/* 헤더 */}
 <div className="space-y-5">
 <div className="w-16 h-16 bg-surface dark:bg-surface-elevated ring-1 ring-black/5 dark:ring-white/10 rounded-[16px] flex items-center justify-center shadow-sm">
 <Logo size="32px" className="text-text-primary" />
 </div>
 <div className="space-y-2">
 <InfoTooltip
 label={
 <h1 className="text-2xl font-black text-text-primary tracking-tight">
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

 <div className="space-y-2">
 <label className="text-sm block font-semibold text-text-primary ml-1">
 {t("seatLabel")}
 </label>
 {promotionCode ? (
 <div className="flex h-[52px] w-full items-center rounded-[16px] border-none bg-sub-background px-5 text-[15px] font-semibold text-text-muted cursor-not-allowed">
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
 <Button
 type="button"
 onClick={() => {
 const code = window.prompt(t("promotionCodePlaceholder"));
 if (code !== null) {
 handlePromotionCodeChange(code.trim().toUpperCase());
 }
 }}
 className="text-[13px] font-semibold text-primary hover:text-primary-light transition-colors min-h-0 p-0"
 >
 {t("registerPromotionCode")}
 </Button>
 ) : (
 <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-[16px]">
 <div className="space-y-0.5">
 <span className="text-[11px] font-black text-primary block">{t("appliedPromotionCode")}</span>
 <span className="text-sm font-bold text-text-primary">{promotionCode}</span>
 </div>
 <Button
 type="button"
 onClick={() => handlePromotionCodeChange("")}
 className="text-[12px] font-bold text-text-muted hover:text-text-secondary px-2 py-1 min-h-0"
 >
 {t("cancelPromotionCode")}
 </Button>
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
 variant="hero"
 size="hero"
 className="w-full"
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
 className="text-[14px] font-semibold text-text-muted transition-colors active:text-text-primary"
 >
 {t("goToJoinText")}
 </Link>
 </div>
 </div>
 </div>
 );
}
