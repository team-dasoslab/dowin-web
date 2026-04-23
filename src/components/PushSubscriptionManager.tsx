"use client";

import { publicRuntimeConfig } from "@/config/public-runtime-config";
import { useToast } from "@/context/ToastContext";
import { getFetchErrorMessage } from "@/lib/client/frontend-api";
import { trackEvent } from "@/lib/client/gtag";
import { Alert16Regular, AlertOff16Regular } from "@fluentui/react-icons";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useRef, useState } from "react";

interface PushSubscriptionManagerProps {
  variant?: "button" | "toggle";
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

const checkiOSSupport = () => {
  const ua = navigator.userAgent;
  const isiOS = /iphone|ipad|ipod/i.test(ua);
  if (!isiOS) return true;

  const versionMatch = ua.match(/OS (\d+)_(\d+)/i);
  if (versionMatch) {
    const major = parseInt(versionMatch[1], 10);
    const minor = parseInt(versionMatch[2], 10);
    return major > 16 || (major === 16 && minor >= 4);
  }

  // Fallback for major versions like 'OS 17' without minor part
  const majorVersionMatch = ua.match(/OS (\d+)/i);
  if (majorVersionMatch) {
    const major = parseInt(majorVersionMatch[1], 10);
    return major > 16;
  }

  return false; // Assume not supported if version can't be parsed
};

export default function PushSubscriptionManager({
  variant = "button",
  onSubscriptionChange,
}: PushSubscriptionManagerProps) {
  const t = useTranslations("PushNotification");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { showToast } = useToast();
  const lastReportedSubscriptionRef = useRef<boolean | null>(null);
  const notifySubscriptionChange = useEffectEvent((next: boolean) => {
    if (lastReportedSubscriptionRef.current === next) {
      return;
    }

    lastReportedSubscriptionRef.current = next;
    onSubscriptionChange?.(next);
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setIsInitialLoading(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        notifySubscriptionChange(!!subscription);
      } catch (error) {
        console.error("Check subscription failed:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    void checkSubscription();
  }, [notifySubscriptionChange]);

  const subscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!checkiOSSupport()) {
      showToast("error", t("unsupportedIos"));
      return;
    }

    // Optimistic update
    setIsSubscribed(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      if (!("Notification" in window)) {
        // Rollback
        setIsSubscribed(false);
        showToast("error", t("unsupportedBrowser"));
        return;
      }

      // Request permission
      trackEvent("notification_permission_requested");
      const permission = await window.Notification.requestPermission();
      if (permission !== "granted") {
        trackEvent("notification_permission_denied");
        // Rollback
        setIsSubscribed(false);
        showToast("error", t("permissionDenied"));
        return;
      }
      trackEvent("notification_permission_granted");

      const vapidPublicKey = publicRuntimeConfig.nextPublicVapidPublicKey;
      if (!vapidPublicKey) {
        throw new Error("VAPID Public Key가 환경 변수에 설정되지 않았습니다.");
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Save to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (!response.ok) {
        throw new Error(
          await getFetchErrorMessage(
            response,
            `서버 저장 실패: ${response.status} ${response.statusText}`,
          ),
        );
      }

      notifySubscriptionChange(true);
      showToast("success", t("subscribeSuccess"));
    } catch (error) {
      // Rollback
      setIsSubscribed(false);
      console.error("Push subscription technical error:", error);

      if (error instanceof Error && error.message.includes("permission")) {
        showToast("error", t("permissionBlocked"));
      } else if (error instanceof Error && error.message.includes("VAPID")) {
        showToast("error", t("vapidConfigError"));
      } else if (
        publicRuntimeConfig.isDevelopment &&
        error instanceof Error &&
        error.message.includes("service worker")
      ) {
        showToast("error", t("serviceWorkerError"));
      } else {
        showToast(
          "error",
          error instanceof Error ? error.message : t("subscribeError"),
        );
      }
    }
  };

  const unsubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setIsSubscribed(false);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        const response = await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        if (!response.ok) {
          throw new Error(
            await getFetchErrorMessage(response, t("unsubscribeError")),
          );
        }
      }
      notifySubscriptionChange(false);
      showToast("info", t("unsubscribeSuccess"));
    } catch (error) {
      // Rollback
      setIsSubscribed(true);
      console.error("Unsubscribe failed:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : t("unsubscribeError"),
      );
    }
  };

  if (isInitialLoading) {
    if (variant === "toggle")
      return (
        <div className="w-10 h-5 bg-zinc-200 animate-pulse rounded-full" />
      );
    return <div className="animate-pulse h-10 w-32 bg-zinc-200 rounded-lg" />;
  }

  if (variant === "toggle") {
    return (
      <button
        type="button"
        onClick={(e) => (isSubscribed ? unsubscribe(e) : subscribe(e))}
        className={`relative inline-flex h-[22px] w-[42px] flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
          isSubscribed ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm ring-0 transition duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${
            isSubscribed ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </button>
    );
  }

  return (
    <button
      onClick={(e) => (isSubscribed ? unsubscribe(e) : subscribe(e))}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
        isSubscribed
          ? "bg-sub-background text-text-muted hover:bg-border transition-colors animate-linear-in"
          : "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/10 animate-linear-in"
      }`}
    >
      {isSubscribed ? <AlertOff16Regular /> : <Alert16Regular />}
      {isSubscribed ? t("buttonUnsubscribe") : t("buttonSubscribe")}
    </button>
  );
}

// Helper function
function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) {
    throw new Error("Base64 string is missing");
  }
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
