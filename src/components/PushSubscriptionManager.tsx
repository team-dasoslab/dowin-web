"use client";

import { useToast } from "@/context/ToastContext";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

interface PushSubscriptionManagerProps {
  userId: string;
  variant?: "button" | "toggle";
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
  userId,
  variant = "button",
}: PushSubscriptionManagerProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    checkSubscription();
  }, []);

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
    } catch (error) {
      console.error("Check subscription failed:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const subscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!checkiOSSupport()) {
      showToast("error", "iOS 16.4 이상에서만 알림을 지원합니다.");
      return;
    }

    // Optimistic update
    setIsSubscribed(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      if (!("Notification" in window)) {
        // Rollback
        setIsSubscribed(false);
        showToast(
          "error",
          "이 브라우저는 알림 기능을 지원하지 않습니다. 아이폰을 사용 중이시라면 '홈 화면에 추가'를 통해 앱을 설치한 후 다시 시도해 주세요.",
        );
        return;
      }

      // Request permission
      const permission = await window.Notification.requestPermission();
      if (permission !== "granted") {
        // Rollback
        setIsSubscribed(false);
        showToast(
          "error",
          "알림 권한이 거부되었습니다. 원활한 사용을 위해 브라우저 설정에서 알림을 허용해 주세요.",
        );
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
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
        body: JSON.stringify({ subscription, userId }),
      });

      if (!response.ok) {
        throw new Error(
          `서버 저장 실패: ${response.status} ${response.statusText}`,
        );
      }

      showToast("success", "매일 밤 9시 알림이 설정되었습니다.");
    } catch (error) {
      // Rollback
      setIsSubscribed(false);
      console.error("Push subscription technical error:", error);

      if (error instanceof Error && error.message.includes("permission")) {
        showToast(
          "error",
          "브라우저의 알림 권한이 차단되어 있습니다. 설정에서 권한을 허용해 주세요.",
        );
      } else if (error instanceof Error && error.message.includes("VAPID")) {
        showToast(
          "error",
          "알림 서비스 설정에 문제가 발생했습니다. 관리자에게 문의해 주세요.",
        );
      } else if (
        process.env.NODE_ENV === "development" &&
        error instanceof Error &&
        error.message.includes("service worker")
      ) {
        showToast(
          "error",
          "PWA 서비스 워커가 등록되지 않았습니다. 빌드 후 프리뷰(yarn preview)에서 테스트해주세요.",
        );
      } else {
        showToast(
          "error",
          "알림 설정 중 잠시 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
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
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }
      showToast("info", "알림 설정이 해제되었습니다.");
    } catch (error) {
      // Rollback
      setIsSubscribed(true);
      console.error("Unsubscribe failed:", error);
    }
  };

  if (isInitialLoading) {
    if (variant === "toggle")
      return (
        <div className="w-10 h-5 bg-gray-200 animate-pulse rounded-full" />
      );
    return <div className="animate-pulse h-10 w-32 bg-gray-200 rounded-lg" />;
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
      {isSubscribed ? <BellOff size={16} /> : <Bell size={16} />}
      {isSubscribed ? "9시 알림 해제" : "매일 9시 알림 받기"}
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
