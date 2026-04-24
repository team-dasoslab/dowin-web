/**
 * push_followup_log_checked 이벤트 지원 유틸
 *
 * 푸시 알림 클릭 이후 24시간 내 daily_log_checked가 발생하면
 * push_followup_log_checked 이벤트를 GA4에 별도로 전송한다.
 *
 * 이 방식으로 BigQuery 없이도 GA4 Data API만으로 푸시 후속 전환을 집계할 수 있다.
 */

const STORAGE_KEY = "dowin.push_followup_context";
const FOLLOWUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24시간

type PushFollowupContext = {
  pushedAt: number; // ms timestamp
  pushType: string;
  campaignId: string;
};

/** push_notification_opened_target 발생 시 호출 — 컨텍스트를 sessionStorage에 저장 */
export function markPushFollowupContext(
  pushType: string,
  campaignId: string,
): void {
  if (typeof window === "undefined") return;

  const context: PushFollowupContext = {
    pushedAt: Date.now(),
    pushType,
    campaignId,
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    // sessionStorage 접근 불가 환경 무시
  }
}

/**
 * daily_log_checked 발생 시 호출 — 24시간 이내 푸시 컨텍스트가 있으면 반환,
 * 없거나 만료되었으면 null 반환
 */
export function consumePushFollowupContext(): PushFollowupContext | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const context = JSON.parse(raw) as PushFollowupContext;
    const elapsed = Date.now() - context.pushedAt;

    if (elapsed > FOLLOWUP_WINDOW_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // 소비 후 삭제 (중복 전송 방지)
    window.sessionStorage.removeItem(STORAGE_KEY);
    return context;
  } catch {
    return null;
  }
}
