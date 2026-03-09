"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

interface PushSubscriptionManagerProps {
  userId: string;
  variant?: "button" | "toggle";
}

export default function PushSubscriptionManager({
  userId,
  variant = "button",
}: PushSubscriptionManagerProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setLoading(false);
      return;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        setLoading(false);
        return;
      }
      const subscription = await registrations[0].pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Check subscription failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const registration = registrations[0];

      if (!registration) {
        if (process.env.NODE_ENV === "development") {
          alert(
            "PWA 서비스 워커가 등록되지 않았습니다. 빌드 후 프리뷰(yarn preview)에서 테스트해주세요.",
          );
        } else {
          alert(
            "브라우저 환경에서 알림 기능을 준비할 수 없습니다. 잠시 후 다시 시도해 주세요.",
          );
        }
        setLoading(false);
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("알림 권한이 거부되었습니다.");
        setLoading(false);
        return;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      // Save to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, userId }),
      });

      setIsSubscribed(true);
      alert("매일 밤 9시 알림이 설정되었습니다! ✨");
    } catch (error) {
      console.error("Push subscription failed:", error);
      alert("알림 설정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const registration = registrations[0];
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      setIsSubscribed(false);
      alert("알림 설정이 해제되었습니다.");
    } catch (error) {
      console.error("Unsubscribe failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
