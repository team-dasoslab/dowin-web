"use client";

import {
  getGetContactInquiriesQueryKey,
  usePostContactInquiries,
} from "@/api/generated/contact/contact";
import type {
  ContactInquiryCreateRequest,
  ContactInquiryDetail,
} from "@/api/generated/dowin.schemas";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

type UseContactInquiryMutationParams = {
  onSubmitted: (inquiry: ContactInquiryDetail) => void;
};

export function useContactInquiryMutation({
  onSubmitted,
}: UseContactInquiryMutationParams) {
  const t = useTranslations("ContactPage");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const mutation = usePostContactInquiries();

  const submit = async (data: ContactInquiryCreateRequest) => {
    try {
      const response = await mutation.mutateAsync({ data });

      if (response.status !== 201) {
        throw response;
      }

      onSubmitted(response.data);
      await queryClient.invalidateQueries({
        queryKey: getGetContactInquiriesQueryKey(),
      });
      showToast("success", t("toastSuccess"));
    } catch (error) {
      const status = getApiErrorStatus(error);

      if (status === 401) {
        showToast("error", t("toastUnauthorized"));
        router.replace("/");
        return;
      }

      showToast("error", getApiErrorMessage(error, t("toastError")));
    }
  };

  return {
    isSubmitting: mutation.isPending,
    submit,
  };
}
