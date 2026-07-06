"use client";

import { useNotificationSettingActions } from "@/app/[locale]/(protected)/profile/_hooks/useNotificationSettingActions";
import { Switch } from "@/components/ui/Switch";

type NotificationSettingControlProps = {
  disabled?: boolean;
  onSubscriptionChange: (isSubscribed: boolean) => void;
};

export function NotificationSettingControl({
  disabled = false,
  onSubscriptionChange,
}: NotificationSettingControlProps) {
  const { isRegistered, isToggleDisabled, handleEnable, handleDisable, t } =
    useNotificationSettingActions(disabled, onSubscriptionChange);

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-2"
      data-coachmark="profile-personal-reminder"
    >
      <Switch
        disabled={isToggleDisabled}
        checked={isRegistered}
        onCheckedChange={(checked) => {
          void (checked ? handleEnable() : handleDisable());
        }}
        aria-label={isRegistered ? t("toggleOff") : t("toggleOn")}
      />
    </div>
  );
}
