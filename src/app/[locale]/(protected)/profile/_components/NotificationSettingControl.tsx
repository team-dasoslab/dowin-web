"use client";

import {
  useDeleteNotificationsDevices,
  usePostNotificationsDevices,
  usePostNotificationsDevicesStatus,
} from "@/api/generated/notification/notification";
import { useNativeApp } from "@/context/NativeAppContext";
import { useToast } from "@/context/ToastContext";
import {
  bridge,
  getAppVersion,
  getBridgeNotificationPermission,
  getBridgePlatform,
  getPushToken,
  isNativeApp as isNativeBridgeAvailable,
  requestNotificationPermission,
} from "@/lib/bridge";
import { getApiErrorMessage } from "@/lib/client/frontend-api";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

type NotificationSettingControlProps = {
  disabled?: boolean;
  onSubscriptionChange: (isSubscribed: boolean) => void;
};

export function NotificationSettingControl({
  disabled = false,
  onSubscriptionChange,
}: NotificationSettingControlProps) {
  const t = useTranslations("Profile.NotificationControl");
  const isNativeFromHeader = useNativeApp();
  const { showToast } = useToast();
  const { mutateAsync: registerDevice } = usePostNotificationsDevices();
  const { mutateAsync: getDeviceStatus } = usePostNotificationsDevicesStatus();
  const { mutateAsync: disableDevice, isPending: isDisablePending } =
    useDeleteNotificationsDevices();
  const [isRegisterPending, setIsRegisterPending] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permission, setPermission] = useState(
    getBridgeNotificationPermission(),
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isBridgeAvailable, setIsBridgeAvailable] = useState(false);
  const onSubscriptionChangeRef = useRef(onSubscriptionChange);
  const isNativeApp = isNativeFromHeader || isBridgeAvailable;

  useEffect(() => {
    onSubscriptionChangeRef.current = onSubscriptionChange;
  }, [onSubscriptionChange]);

  useEffect(() => {
    setIsBridgeAvailable(isNativeBridgeAvailable());
  }, []);

  useEffect(() => {
    if (!isNativeApp) {
      setPermission("denied");
      setIsRegistered(false);
      setIsCheckingStatus(false);
      onSubscriptionChangeRef.current(false);
      return;
    }

    setPermission(getBridgeNotificationPermission());

    const unsubscribe = bridge.store.subscribe((state) => {
      setPermission(state.notificationPermission);
    });

    return unsubscribe;
  }, [isNativeApp]);

  useEffect(() => {
    if (!isNativeApp || permission !== "granted") {
      setIsRegistered(false);
      setIsCheckingStatus(false);
      onSubscriptionChangeRef.current(false);
      return;
    }

    let cancelled = false;

    const syncDeviceStatus = async () => {
      try {
        setIsCheckingStatus(true);
        const token = await getPushToken();
        const response = await getDeviceStatus({
          data: { token },
        });

        if (response.status !== 200) {
          throw response;
        }

        if (!cancelled) {
          const enabled = response.data.notificationEnabled;
          setIsRegistered(enabled);
          onSubscriptionChangeRef.current(enabled);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load current device push status:", error);
          setIsRegistered(false);
          onSubscriptionChangeRef.current(false);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingStatus(false);
        }
      }
    };

    void syncDeviceStatus();

    return () => {
      cancelled = true;
    };
  }, [getDeviceStatus, isNativeApp, permission]);

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
        onSubscriptionChangeRef.current(true);

        if (!silent) {
          showToast("success", t("enabled"));
        }
      } finally {
        setIsRegisterPending(false);
      }
    },
    [registerDevice, showToast, t],
  );

  const handleEnable = async () => {
    try {
      setIsSyncing(true);
      const nextPermission = await requestNotificationPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        showToast("error", t("permissionDenied"));
        return;
      }

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
      const response = await disableDevice({
        data: { token },
      });

      if (response.status !== 200) {
        throw response;
      }

      setIsRegistered(false);
      onSubscriptionChangeRef.current(false);
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
    isCheckingStatus ||
    isRegisterPending ||
    isDisablePending ||
    !isNativeApp;

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-2"
      data-coachmark="profile-personal-reminder"
    >
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
