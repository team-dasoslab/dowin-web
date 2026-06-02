"use client";

import { postWorkspacesCheckout, postWorkspacesBetaPromotionRedeem } from "@/api/generated/workspace/workspace";
import { trackEvent } from "@/lib/client/gtag";
import { useRouter } from "@/i18n/routing";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useState } from "react";

type WorkspaceCreateError = {
  data?: {
    message?: string;
  };
};

type UseCreateWorkspaceMutationParams = {
  onError: (message: string) => void;
};

export const useCreateWorkspaceMutation = ({
  onError,
}: UseCreateWorkspaceMutationParams) => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const submitCreateWorkspace = async (name: string, seatCount: number, promotionCode?: string) => {
    setIsPending(true);
    try {
      if (promotionCode) {
        // 프로모션 코드가 있는 경우
        const response = await postWorkspacesBetaPromotionRedeem({
          code: promotionCode,
          workspaceName: name,
        });

        if (response.status !== 201 || !response.data.workspaceId) {
          onError("마케팅 프로모션 코드 사용 중 오류가 발생했습니다.");
          return;
        }

        trackEvent("marketing_workspace_created", {
          acquisition_source: "MARKETING_INVITE",
          entitlement_source: "BETA_PROMOTIONAL_GRANT",
        });

        // 생성된 워크스페이스 대시보드로 이동
        router.push(`/${response.data.workspaceId}/dashboard`);
        return;
      }

      // 프로모션 코드가 없는 경우 (기존 Checkout 로직)
      const response = await postWorkspacesCheckout(
        {
          workspaceName: name,
          seatCount,
        },
        {
          headers: {
            "Idempotency-Key": createWorkspaceCheckoutIdempotencyKey(),
          },
        },
      );

      if (
        response.status !== 201 ||
        !response.data.checkoutUrl ||
        !response.data.workspaceCheckoutId
      ) {
        onError("워크스페이스 결제 준비 중 오류가 발생했습니다.");
        return;
      }

      trackEvent("workspace_checkout_started", {
        checkout_method: "basic_seat_checkout",
      });
      window.location.assign(response.data.checkoutUrl);
    } catch (error) {
      onError(
        getApiErrorMessage(error, "워크스페이스 생성 중 오류가 발생했습니다.")
      );
    } finally {
      setIsPending(false);
    }
  };

  return {
    isPending,
    submitCreateWorkspace,
  };
};

function createWorkspaceCheckoutIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `workspace_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
