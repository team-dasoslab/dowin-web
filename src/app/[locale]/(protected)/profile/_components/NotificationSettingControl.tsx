"use client";

import {
  useDeleteNotificationsDevices,
  usePostNotificationsDevices,
} from "@/api/generated/notification/notification";
import { useNativeApp } from "@/context/NativeAppContext";
import { useToast } from "@/context/ToastContext";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import {
  bridge,
  getAppVersion,
  getBridgeNotificationPermission,
  getBridgePlatform,
  getPushToken,
  requestNotificationPermission,
} from "@/lib/bridge";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useState } from "react";

const DEVICE_NOTIFICATION_PREFERENCE_KEY =
  "dowin.notifications.current-device.enabled";

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
  const t = useTranslations("Profile.NotificationControl");
  const isNativeApp = useNativeApp();
  const { showToast } = useToast();
  const registerDeviceMutation = usePostNotificationsDevices();
  const disableDeviceMutation = useDeleteNotificationsDevices();
  const [isRegistered, setIsRegistered] = useState(isSubscribed);
  const [permission, setPermission] = useState(
    getBridgeNotificationPermission(),
  );
  const [shouldResyncOnLoad, setShouldResyncOnLoad] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsRegistered(isSubscribed);
  }, [isSubscribed]);

  useEffect(() => {
    if (!isNativeApp) {
      setPermission("denied");
      return;
    }

    setShouldResyncOnLoad(
      window.localStorage.getItem(DEVICE_NOTIFICATION_PREFERENCE_KEY) === "1",
    );
    setPermission(getBridgeNotificationPermission());

    const unsubscribe = bridge.store.subscribe((state) => {
      setPermission(state.notificationPermission);
    });

    return unsubscribe;
  }, [isNativeApp]);

  const registerCurrentDevice = useEffectEvent(
    async ({ silent }: { silent: boolean }) => {
      const token = await getPushToken();
      const appVersion = await getAppVersion();
      const response = await registerDeviceMutation.mutateAsync({
        data: {
          provider: "FCM",
          platform: getBridgePlatform(),
          token,
          appVersion: appVersion ?? undefined,
          notificationEnabled: true,
        },
      });

      if (response.status !== 200) {
        throw response;
      }

      setIsRegistered(true);
      onSubscriptionChange(true);

      if (!silent) {
        showToast("success", t("enabled"));
      }
    },
  );

  useEffect(() => {
    if (
      !isNativeApp ||
      !shouldResyncOnLoad ||
      permission !== "granted" ||
      isRegistered ||
      isSyncing
    ) {
      return;
    }

    let cancelled = false;

    const syncRegisteredDevice = async () => {
      try {
        setIsSyncing(true);
        await registerCurrentDevice({ silent: true });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to sync native push token:", error);
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    };

    void syncRegisteredDevice();

    return () => {
      cancelled = true;
    };
  }, [
    isNativeApp,
    isRegistered,
    isSyncing,
    permission,
    registerCurrentDevice,
    shouldResyncOnLoad,
  ]);

  const handleEnable = async () => {
    try {
      setIsSyncing(true);
      const nextPermission = await requestNotificationPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        showToast("error", t("permissionDenied"));
        return;
      }

      window.localStorage.setItem(DEVICE_NOTIFICATION_PREFERENCE_KEY, "1");
      setShouldResyncOnLoad(true);
      await registerCurrentDevice({ silent: false });
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("enableFailed")));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisable = async () => {
    try {
      setIsSyncing(true);
      const token = await getPushToken();
      const response = await disableDeviceMutation.mutateAsync({
        data: { token },
      });

      if (response.status !== 200) {
        throw response;
      }

      window.localStorage.setItem(DEVICE_NOTIFICATION_PREFERENCE_KEY, "0");
      setShouldResyncOnLoad(false);
      setIsRegistered(false);
      onSubscriptionChange(false);
      showToast("info", t("disabled"));
    } catch (error) {
      showToast("error", getApiErrorMessage(error, t("disableFailed")));
    } finally {
      setIsSyncing(false);
    }
  };

  const isToggleDisabled =
    disabled ||
    isSyncing ||
    registerDeviceMutation.isPending ||
    disableDeviceMutation.isPending ||
    !isNativeApp;

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-2"
      data-coachmark="profile-personal-reminder"
    >
      <select
        value={dailyReminderTime}
        disabled={disabled || !isRegistered}
        onChange={(event) => onDailyReminderTimeChange(event.target.value)}
        className="h-9 cursor-pointer rounded-button border border-border bg-sub-background px-3 text-center text-xs font-bold text-text-primary outline-none transition-all focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:bg-sub-background disabled:text-text-muted"
      >
        {timeOptions.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isToggleDisabled}
        onClick={() => {
          void (isRegistered ? handleDisable() : handleEnable());
        }}
        className={`relative inline-flex h-[22px] w-[42px] flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
          isRegistered ? "bg-primary" : "bg-border"
        }`}
        aria-label={isRegistered ? t("toggleOff") : t("toggleOn")}
      >
        <span
          className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ${
            isRegistered ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </button>
      {!isNativeApp ? (
        <span className="text-[11px] font-medium text-text-muted">
          {t("appOnly")}
        </span>
      ) : null}
    </div>
  );
}
