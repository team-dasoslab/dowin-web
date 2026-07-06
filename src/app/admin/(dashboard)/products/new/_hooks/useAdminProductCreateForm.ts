import { usePostAdminBillingProviderProducts } from "@/api/generated/admin-billing/admin-billing";
import {
  AdminBillingProviderProductUpsertRequestEnvironment,
  AdminBillingProviderProductUpsertRequestPlanCode,
} from "@/api/generated/dowin.schemas";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useAdminProductCreateForm = () => {
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast("error", error?.response?.data?.message || "알 수 없는 오류");
    }
  };

  return {
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
    isPending: createMutation.isPending,
    handleCreate,
  };
};
