"use client";

import {
  getGetPushSettingsQueryKey,
  useGetPushSettings,
  usePutPushSettings,
} from "@/api/generated/notification/notification";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useQueryClient } from "@tanstack/react-query";

export const TIME_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const hour = index + 6;
  return `${String(hour).padStart(2, "0")}:00`;
});

export const useNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: dailyResponse, isLoading: isDailyLoading } = useGetPushSettings();
  const updateDailyMutation = usePutPushSettings();

  const dailySettings =
    dailyResponse?.status === 200 ? dailyResponse.data : null;

  const refreshSettings = async () => {
    await queryClient.invalidateQueries({
      queryKey: getGetPushSettingsQueryKey(),
    });
  };

  const updateDailySettings = async (dailyReminderTime: string) => {
    try {
      const response = await updateDailyMutation.mutateAsync({
        data: {
          dailyReminderEnabled: true,
          dailyReminderTime,
        },
      });

      if (response.status !== 200) {
        throw response;
      }

      await queryClient.invalidateQueries({
        queryKey: getGetPushSettingsQueryKey(),
      });
      showToast("success", "일일 리마인드 시간이 변경되었습니다.");
    } catch (error) {
      showToast(
        "error",
        getApiErrorMessage(error, "일일 리마인드 시간 변경에 실패했습니다."),
      );
    }
  };

  return {
    dailySettings,
    isDailyLoading,
    isUpdatingDaily: updateDailyMutation.isPending,
    refreshSettings,
    updateDailySettings,
  };
};
