import { getGetWorkspacesWorkspaceIdBillingMeQueryKey, usePatchWorkspacesWorkspaceIdBillingSeats } from "@/api/generated/billing/billing";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

export const useUpdateWorkspaceSeatsMutation = (workspaceId: string) => {
  const t = useTranslations("ProfileBilling");
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { mutate, isPending } = usePatchWorkspacesWorkspaceIdBillingSeats({
    mutation: {
      onSuccess: () => {
        showToast("success", t("seatChangeSuccess"));
        void queryClient.invalidateQueries({
          queryKey: getGetWorkspacesWorkspaceIdBillingMeQueryKey(workspaceId),
        });
      },
      onError: (error) => {
        showToast("error", getApiErrorMessage(error, t("seatChangeFailed")));
      },
    },
  });

  return {
    updateSeats: mutate,
    isUpdatingSeats: isPending,
  };
};
