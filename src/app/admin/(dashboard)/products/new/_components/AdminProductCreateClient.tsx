"use client";

import {
  AdminBillingProviderProductUpsertRequestEnvironment,
  AdminBillingProviderProductUpsertRequestPlanCode,
} from "@/api/generated/dowin.schemas";
import { useAdminProductCreateForm } from "@/app/admin/(dashboard)/products/new/_hooks/useAdminProductCreateForm";
import AdminFormLayout from "@/app/admin/_components/AdminFormLayout";
import { InlineSpinner } from "@/components/InlineSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";

export default function AdminProductCreateClient() {
  const {
    environment,
    setEnvironment,
    planCode,
    setPlanCode,
    providerProductId,
    setProviderProductId,
    isActive,
    setIsActive,
    changeReason,
    setChangeReason,
    isPending,
    handleCreate,
  } = useAdminProductCreateForm();

  return (
    <AdminFormLayout
      title="새 상품 등록"
      description="가입 및 플랜 변경 시 연동될 Polar product ID를 환경별로 등록합니다."
      backHref="/admin/products"
    >
      <Card radius="xl" padding="lg" variant="white" shadow="none">
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
                    e.target
                      .value as AdminBillingProviderProductUpsertRequestEnvironment,
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
                    e.target
                      .value as AdminBillingProviderProductUpsertRequestPlanCode,
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
                className="font-bold"
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
                className="font-bold"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 px-4 py-3 border-none bg-zinc-100 rounded-[16px] cursor-pointer hover:bg-border transition-colors w-fit shrink-0">
                <Checkbox
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
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
              disabled={isPending}
              variant="solid-dark"
              size="primary"
              className="gap-2"
            >
              {isPending ? <InlineSpinner /> : <span>저장하기</span>}
            </Button>
          </div>
        </form>
      </Card>
    </AdminFormLayout>
  );
}
