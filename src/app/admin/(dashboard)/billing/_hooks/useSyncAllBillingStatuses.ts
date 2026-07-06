import { usePostAdminBillingWorkspacesSyncStatus } from "@/api/generated/admin-billing/admin-billing";
import { useToast } from "@/context/ToastContext";

export const useSyncAllBillingStatuses = (onSuccess?: () => void) => {
  const { showToast } = useToast();
  const syncStatusMutation = usePostAdminBillingWorkspacesSyncStatus();

  const handleSyncAllStatuses = async () => {
    try {
      const response = await syncStatusMutation.mutateAsync();

      if (response.status === 200) {
        showToast(
          "success",
          `현재 기준으로 ${response.data.syncedCount}개 워크스페이스의 billing 상태를 동기화했습니다.`,
        );
        onSuccess?.();
      } else {
        showToast("error", "billing 상태 전체 동기화에 실패했습니다.");
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        error?.response?.data?.message ||
          error?.message ||
          "billing 상태 전체 동기화에 실패했습니다.",
      );
    }
  };

  return {
    isPending: syncStatusMutation.isPending,
    handleSyncAllStatuses,
  };
};
