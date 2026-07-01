"use client";

import { useState } from "react";
import { usePostAdminMarketingInviteCodes } from "@/api/generated/admin-marketing/admin-marketing";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { InlineSpinner } from "@/components/InlineSpinner";
import { useToast } from "@/context/ToastContext";
import AdminFormLayout from "@/app/admin/_components/AdminFormLayout";
import { generatePromotionCode } from "@/lib/utils";

export default function AdminPromotionCreateClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const createMutation = usePostAdminMarketingInviteCodes();

  const [code, setCode] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("10");
  const [grantedSeatCount, setGrantedSeatCount] = useState("10");
  const [expiresAt, setExpiresAt] = useState("");
  const [entitlementDurationDays, setEntitlementDurationDays] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const maxUsesNum = parseInt(maxUses, 10);
    const grantedSeatCountNum = parseInt(grantedSeatCount, 10);

    if (!code || !campaignName || isNaN(maxUsesNum) || isNaN(grantedSeatCountNum)) {
      showToast("error", "필수 항목을 모두 입력해주세요.");
      return;
    }

    try {
      const response = await createMutation.mutateAsync({
        data: {
          code,
          campaignName,
          description: description || undefined,
          maxUses: maxUsesNum,
          grantedSeatCount: grantedSeatCountNum,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          entitlementDurationDays: entitlementDurationDays ? parseInt(entitlementDurationDays, 10) : undefined,
        },
      });

      if (response.status === 201) {
        showToast("success", "프로모션 코드가 생성되었습니다.");
        router.push("/admin/promotions");
      } else {
        showToast("error", "코드 생성에 실패했습니다.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMsg =
        error?.response?.data?.message || "코드 생성 중 오류가 발생했습니다.";
      showToast("error", errorMsg);
    }
  };

  return (
    <AdminFormLayout
      title="새 프로모션 코드 생성"
      description="워크스페이스 프로모션 코드(Basic) 프로모션 초대코드를 새로 발급합니다."
      backHref="/admin/promotions"
    >
      <Card className="bg-white border-none shadow-none rounded-[24px] overflow-hidden p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
              코드 <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="예: DOWIN2026BETA"
                className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
                required
              />
              <Button
                type="button"
                onClick={() => setCode(generatePromotionCode())}
                variant="ghost-primary"
                size="primary"
                className="shrink-0"
              >
                자동 생성
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
              캠페인 이름 <span className="text-danger">*</span>
            </label>
            <Input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="예: 초기 클로즈드 베타 피드백 모집"
              className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
              설명
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="캠페인에 대한 운영자 메모를 남겨주세요."
              rows={3}
              className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary resize-none placeholder:text-zinc-400 min-h-[auto]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
                최대 사용 횟수 <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                value={maxUses}
                min={1}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
                부여 좌석(Seat) 수 <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                value={grantedSeatCount}
                min={1}
                max={10}
                onChange={(e) => setGrantedSeatCount(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
                코드 만료 일시 (선택)
              </label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
                혜택 유지 기간 (일수, 선택)
              </label>
              <Input
                type="number"
                min={1}
                value={entitlementDurationDays}
                onChange={(e) => setEntitlementDurationDays(e.target.value)}
                placeholder="예: 14 (제한 없음은 비워두세요)"
                className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary placeholder:text-zinc-400"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: "1주", value: "7" },
                  { label: "2주", value: "14" },
                  { label: "1달", value: "30" },
                  { label: "2달", value: "60" },
                  { label: "1년", value: "365" },
                  { label: "무제한", value: "" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEntitlementDurationDays(preset.value)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-zinc-100 text-text-secondary hover:bg-zinc-200 rounded-[8px] transition-colors border border-transparent hover:border-zinc-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              variant="solid-dark"
              size="primary"
              className="gap-2"
            >
              {createMutation.isPending ? <InlineSpinner /> : <span>생성하기</span>}
            </Button>
          </div>
        </form>
      </Card>
    </AdminFormLayout>
  );
}
