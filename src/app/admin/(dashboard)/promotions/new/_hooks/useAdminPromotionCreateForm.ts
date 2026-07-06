import { usePostAdminMarketingInviteCodes } from "@/api/generated/admin-marketing/admin-marketing";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useAdminPromotionCreateForm = () => {
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

    if (
      !code ||
      !campaignName ||
      isNaN(maxUsesNum) ||
      isNaN(grantedSeatCountNum)
    ) {
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
          entitlementDurationDays: entitlementDurationDays
            ? parseInt(entitlementDurationDays, 10)
            : undefined,
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

  return {
    code,
    setCode,
    campaignName,
    setCampaignName,
    description,
    setDescription,
    maxUses,
    setMaxUses,
    grantedSeatCount,
    setGrantedSeatCount,
    expiresAt,
    setExpiresAt,
    entitlementDurationDays,
    setEntitlementDurationDays,
    isPending: createMutation.isPending,
    handleSubmit,
  };
};
