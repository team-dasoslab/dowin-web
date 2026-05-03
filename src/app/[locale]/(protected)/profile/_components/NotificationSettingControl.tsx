"use client";

import {
  useDeleteNotificationsDevices,
  usePostNotificationsDevices,
} from "@/api/generated/notification/notification";
import { useNativeApp } from "@/context/NativeAppContext";
import { useToast } from "@/context/ToastContext";
import {
  bridge,
  getAppVersion,
  getBridgeNotificationPermission,
  getBridgePlatform,
  getPushToken,
  requestNotificationPermission,
} from "@/lib/bridge";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const DEVICE_NOTIFICATION_PREFERENCE_KEY =
  "dowin.notifications.current-device.enabled";

const getInitialNotificationPreference = () => {
  if (typeof window !== "undefined") {
    return (
      window.localStorage.getItem(DEVICE_NOTIFICATION_PREFERENCE_KEY) === "1"
    );
  }
  return false;
};

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
  const { mutateAsync: registerDevice } = usePostNotificationsDevices();
  const { mutateAsync: disableDevice, isPending: isDisablePending } =
    useDeleteNotificationsDevices();
  const [isRegisterPending, setIsRegisterPending] = useState(false);
  const initialPreference = getInitialNotificationPreference();
  const [isRegistered, setIsRegistered] = useState(initialPreference);
  const [permission, setPermission] = useState(
    getBridgeNotificationPermission(),
  );
  const [shouldResyncOnLoad, setShouldResyncOnLoad] =
    useState(initialPreference);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncedOnLoad, setHasSyncedOnLoad] = useState(false);

  useEffect(() => {
    if (initialPreference && !isSubscribed) {
      onSubscriptionChange(true);
    }
  }, [initialPreference, isSubscribed, onSubscriptionChange]);

  useEffect(() => {
    if (!isNativeApp) {
      setPermission("denied");
      return;
    }

    setPermission(getBridgeNotificationPermission());

    const unsubscribe = bridge.store.subscribe((state) => {
      setPermission(state.notificationPermission);
    });

    return unsubscribe;
  }, [isNativeApp]);

  const registerCurrentDevice = useCallback(
    async ({ silent }: { silent: boolean }) => {
      const token = await getPushToken();
      const appVersion = await getAppVersion();

      setIsRegisterPending(true);
      try {
        const response = await registerDevice({
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
      } finally {
        setIsRegisterPending(false);
      }
    },
    [onSubscriptionChange, registerDevice, showToast, t],
  );

  useEffect(() => {
    if (
      !isNativeApp ||
      !shouldResyncOnLoad ||
      permission !== "granted" ||
      hasSyncedOnLoad ||
      isSyncing
    ) {
      return;
    }

    let cancelled = false;

    const syncRegisteredDevice = async () => {
      try {
        setIsSyncing(true);
        await registerCurrentDevice({ silent: true });
        if (!cancelled) {
          setHasSyncedOnLoad(true);
        }
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
  }, [isNativeApp, hasSyncedOnLoad, permission, shouldResyncOnLoad]);

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
      setHasSyncedOnLoad(true);
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
      const response = await disableDevice({
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
    isRegisterPending ||
    isDisablePending ||
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
