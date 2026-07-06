import { usePostAdminBillingWorkspacesWorkspaceIdManualOverride } from "@/api/generated/admin-billing/admin-billing";
import {
  AdminBillingManualOverrideRequestBillingStatus,
  AdminBillingManualOverrideRequestEntitlementSource,
  AdminBillingManualOverrideRequestPlanCode,
  AdminBillingWorkspaceSummary,
} from "@/api/generated/dowin.schemas";
import { useToast } from "@/context/ToastContext";
import { useEffect, useState } from "react";

export type EditableEntitlementSource =
  | Exclude<AdminBillingManualOverrideRequestEntitlementSource, null>
  | "";

export const FREE_BILLING_STATUSES: AdminBillingManualOverrideRequestBillingStatus[] =
  ["NONE", "EXPIRED", "REVOKED"];

export const STANDARD_BILLING_STATUSES: AdminBillingManualOverrideRequestBillingStatus[] =
  ["ACTIVE", "CANCELED"];

export const STANDARD_ENTITLEMENT_SOURCES: EditableEntitlementSource[] = [
  "MANUAL_GRANT",
  "PARTNER",
  "INTERNAL_TEST",
  "POLAR",
];

export function normalizeEntitlementSource(
  planCode: AdminBillingManualOverrideRequestPlanCode,
  source: EditableEntitlementSource,
): EditableEntitlementSource {
  if (planCode === "BASIC" || planCode === "STANDARD") {
    if (STANDARD_ENTITLEMENT_SOURCES.includes(source)) {
      return source;
    }

    return "MANUAL_GRANT";
  }

  return source === "POLAR" ? "POLAR" : "";
}

export const useAdminBillingDetailActions = (
  workspaceId: number,
  detail: AdminBillingWorkspaceSummary | undefined,
  refetch: () => void,
) => {
  const { showToast } = useToast();

  const [editPlanCode, setEditPlanCode] =
    useState<AdminBillingManualOverrideRequestPlanCode>("FREE");
  const [editBillingStatus, setEditBillingStatus] =
    useState<AdminBillingManualOverrideRequestBillingStatus>("NONE");
  const [editEntitlementSource, setEditEntitlementSource] =
    useState<EditableEntitlementSource>("");
  const [editPeriodEnd, setEditPeriodEnd] = useState<string>("");
  const [editCancelAtEnd, setEditCancelAtEnd] = useState<boolean>(false);
  const [editSeatCount, setEditSeatCount] = useState<string>("");
  const [editCustomerKey, setEditCustomerKey] = useState<string>("");
  const [editSubscriptionKey, setEditSubscriptionKey] = useState<string>("");
  const [changeReason, setChangeReason] =
    useState<string>("워크스페이스 결제 정보 보정");

  const overrideMutation =
    usePostAdminBillingWorkspacesWorkspaceIdManualOverride();

  useEffect(() => {
    if (detail) {
      setEditPlanCode(detail.planCode || "FREE");
      setEditBillingStatus(detail.billingStatus || "NONE");
      setEditEntitlementSource(
        normalizeEntitlementSource(
          detail.planCode || "FREE",
          detail.entitlementSource || "",
        ),
      );
      setEditPeriodEnd(
        detail.currentPeriodEnd ? detail.currentPeriodEnd.split("T")[0] : "",
      );
      setEditCancelAtEnd(detail.cancelAtPeriodEnd || false);
      setEditSeatCount(
        detail.purchasedSeatCount !== null &&
          detail.purchasedSeatCount !== undefined
          ? String(detail.purchasedSeatCount)
          : "",
      );
      setEditCustomerKey(detail.customerKey || "");
      setEditSubscriptionKey(detail.subscriptionKey || "");
    }
  }, [detail]);

  const handleSaveOverride = async () => {
    if (!changeReason.trim()) {
      showToast("error", "변경 사유를 입력해주세요.");
      return;
    }

    try {
      const response = await overrideMutation.mutateAsync({
        workspaceId: workspaceId,
        data: {
          planCode: editPlanCode,
          billingStatus: editBillingStatus,
          entitlementSource: editEntitlementSource || null,
          currentPeriodEnd: editPeriodEnd
            ? new Date(editPeriodEnd).toISOString()
            : null,
          cancelAtPeriodEnd: editCancelAtEnd,
          purchasedSeatCount: editSeatCount ? Number(editSeatCount) : null,
          changeReason,
        },
      });

      if (response.status === 200) {
        showToast("success", "결제 정보가 보정되었습니다.");
        refetch();
      } else {
        showToast("error", "결제 정보 보정에 실패했습니다.");
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
          "결제 정보 보정에 실패했습니다.",
      );
    }
  };

  return {
    editPlanCode,
    setEditPlanCode,
    editBillingStatus,
    setEditBillingStatus,
    editEntitlementSource,
    setEditEntitlementSource,
    editPeriodEnd,
    setEditPeriodEnd,
    editCancelAtEnd,
    setEditCancelAtEnd,
    editSeatCount,
    setEditSeatCount,
    editCustomerKey,
    editSubscriptionKey,
    changeReason,
    setChangeReason,
    isPending: overrideMutation.isPending,
    handleSaveOverride,
  };
};
