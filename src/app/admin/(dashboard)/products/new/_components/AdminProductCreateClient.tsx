"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePostAdminBillingProviderProducts } from "@/api/generated/admin-billing/admin-billing";
import {
  AdminBillingProviderProductUpsertRequestEnvironment,
  AdminBillingProviderProductUpsertRequestPlanCode,
} from "@/api/generated/dowin.schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { InlineSpinner } from "@/components/InlineSpinner";
import { useToast } from "@/context/ToastContext";
import AdminFormLayout from "@/app/admin/_components/AdminFormLayout";

export default function AdminProductCreateClient() {
  const router = useRouter();
  const { showToast } = useToast();

  const [environment, setEnvironment] =
    useState<AdminBillingProviderProductUpsertRequestEnvironment>("production");
  const [planCode, setPlanCode] =
    useState<AdminBillingProviderProductUpsertRequestPlanCode>("BASIC");
  const [providerProductId, setProviderProductId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [changeReason, setChangeReason] = useState("Polar product ID 등록");

  const createMutation = usePostAdminBillingProviderProducts();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!providerProductId.trim()) {
      showToast("error", "Polar product ID를 입력해주세요.");
      return;
    }

    if (!changeReason.trim()) {
      showToast("error", "변경 사유를 입력해주세요.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        data: {
          provider: "POLAR",
          environment,
          planCode,
          providerProductId: providerProductId.trim(),
          isActive,
          changeReason: changeReason.trim(),
        },
      });

      showToast("success", "새로운 Polar product ID가 등록되었습니다.");
      router.push("/admin/products");
    } catch (error: any) {
      showToast("error", error?.response?.data?.message || "알 수 없는 오류");
    }
  };

  return (
    <AdminFormLayout
      title="새 상품 등록"
      description="가입 및 플랜 변경 시 연동될 Polar product ID를 환경별로 등록합니다."
      backHref="/admin/products"
    >

      <Card className="bg-white border-none shadow-none rounded-[24px] overflow-hidden p-6 sm:p-8">
        <form onSubmit={handleCreate} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black tracking-widest text-text-muted uppercase ml-1">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) =>
                  setEnvironment(
                    e.target.value as AdminBillingProviderProductUpsertRequestEnvironment
                  )
                }
                className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
              >
                <option value="production">production</option>
                <option value="sandbox">sandbox</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black tracking-widest text-text-muted uppercase ml-1">
                Plan
              </label>
              <select
                value={planCode}
                onChange={(e) =>
                  setPlanCode(
                    e.target.value as AdminBillingProviderProductUpsertRequestPlanCode
                  )
                }
                className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
              >
                <option value="BASIC">BASIC</option>
                <option value="STANDARD">STANDARD</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-black tracking-widest text-text-muted uppercase ml-1">
                Polar Product ID
              </label>
              <Input
                type="text"
                value={providerProductId}
                onChange={(e) => setProviderProductId(e.target.value)}
                placeholder="Product ID 입력"
                className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-black tracking-widest text-text-muted uppercase ml-1">
                Change Reason
              </label>
              <Input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="변경 사유 입력"
                className="w-full px-4 py-3 bg-zinc-100 border-none rounded-[16px] text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-text-primary"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 px-4 py-3 border-none bg-zinc-100 rounded-[16px] cursor-pointer hover:bg-zinc-200 transition-colors w-fit shrink-0">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-none bg-white text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-[13px] font-black text-text-primary">
                  Active (활성화)
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="px-8 py-3.5 bg-text-primary text-white font-black text-[14px] rounded-button transition-all flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? <InlineSpinner /> : <span>저장하기</span>}
            </Button>
          </div>
        </form>
      </Card>
    </AdminFormLayout>
  );
}
