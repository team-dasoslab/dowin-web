"use client";

import PushSubscriptionManager from "@/components/PushSubscriptionManager";

type NotificationSettingControlProps = {
  isSubscribed: boolean;
  dailyReminderTime: string;
  disabled?: boolean;
  onSubscriptionChange: (isSubscribed: boolean) => void;
  onDailyReminderTimeChange: (time: string) => void;
  timeOptions: string[];
};

export function NotificationSettingControl({
  isSubscribed,
  dailyReminderTime,
  disabled = false,
  onSubscriptionChange,
  onDailyReminderTimeChange,
  timeOptions,
}: NotificationSettingControlProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={dailyReminderTime}
        disabled={disabled || !isSubscribed}
        onChange={(event) => onDailyReminderTimeChange(event.target.value)}
        className="h-9 rounded-lg border border-border bg-white px-2 text-xs font-semibold text-text-primary disabled:cursor-not-allowed disabled:bg-sub-background disabled:text-text-muted"
      >
        {timeOptions.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      <PushSubscriptionManager
        variant="toggle"
        onSubscriptionChange={onSubscriptionChange}
      />
    </div>
  );
}
