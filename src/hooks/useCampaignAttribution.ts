"use client";

import { trackEvent } from "@/lib/client/gtag";
import { hashId } from "@/lib/client/id-hash";
import { markPushFollowupContext } from "@/lib/client/push-followup";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * URL query parameters를 통해 유입된 캠페인(푸시, 디스코드 리포트 등)을 감지하고 고유 이벤트를 남긴다.
 * 또한 BigQuery 없이 24시간 내 후속 행동(first daily log)을 추적하기 위해 컨텍스트를 저장한다.
 */
export function useCampaignAttribution() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const campaignId = searchParams.get("campaign_id");
    const pushType = searchParams.get("push_type");

    if (!campaignId || !pushType) {
      return;
    }

    // 1. 유입 자체를 GA4에 기록 (push_notification_opened_target과 동일 스키마)
    trackEvent("push_notification_opened_target", {
      campaign_id: hashId(campaignId),
      push_type: pushType,
      delivery_channel: searchParams.get("delivery_channel") ?? "external_link",
      target_path: window.location.pathname,
    });

    // 2. 24시간 내 후속 행동(daily_log_checked) 추적을 위해 sessionStorage에 저장
    markPushFollowupContext(pushType, campaignId);
  }, [searchParams]);
}
