"use client";

import { postWorkspacesCheckout } from "@/api/generated/workspace/workspace";
import { trackEvent } from "@/lib/client/gtag";
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

  const submitCreateWorkspace = async (name: string, seatCount: number) => {
    setIsPending(true);
    try {
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
      const workspaceError = error as WorkspaceCreateError;
      onError(
        workspaceError.data?.message ||
          "워크스페이스 결제 준비 중 오류가 발생했습니다.",
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
