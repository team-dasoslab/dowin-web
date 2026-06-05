"use client";

import { useState } from "react";
import { usePostAdminMarketingInviteCodes } from "@/api/generated/admin-marketing/admin-marketing";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { InlineSpinner } from "@/components/InlineSpinner";
import { useToast } from "@/context/ToastContext";
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
    <div className="space-y-8 animate-dowin-in max-w-2xl mx-auto">
      <div className="space-y-1.5">
        <h1 className="text-[28px] font-black tracking-tighter text-text-primary leading-tight">
          새 프로모션 코드 생성
        </h1>
        <p className="text-[14px] text-text-secondary font-medium tracking-tight break-keep">
          워크스페이스 프로모션 코드(Basic) 프로모션 초대코드를 새로 발급합니다.
        </p>
      </div>

      <Card className="bg-white border border-border rounded-content overflow-hidden p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
              코드 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="예: DOWIN2026BETA"
                className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
                required
              />
              <Button
                type="button"
                onClick={() => setCode(generatePromotionCode())}
                className="shrink-0 px-4 py-3 bg-sub-background border border-border text-text-primary font-black text-[13px] rounded-button transition-all hover:bg-zinc-100"
              >
                자동 생성
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
              캠페인 이름 <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="예: 초기 클로즈드 베타 피드백 모집"
              className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="캠페인에 대한 운영자 메모를 남겨주세요."
              rows={3}
              className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary resize-none placeholder:text-text-muted"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
                최대 사용 횟수 <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={maxUses}
                min={1}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1 block">
                부여 좌석(Seat) 수 <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={grantedSeatCount}
                min={1}
                max={10}
                onChange={(e) => setGrantedSeatCount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-button text-sm focus:border-primary outline-none transition-all font-bold text-text-primary"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-3.5 bg-text-primary text-white font-black text-[13px] rounded-button transition-all flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? <InlineSpinner /> : <span>생성하기</span>}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3.5 bg-white border border-border text-text-primary font-black text-[13px] rounded-button transition-all hover:bg-sub-background"
            >
              취소
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
