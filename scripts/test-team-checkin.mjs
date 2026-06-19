#!/usr/bin/env node
import { parseArgs } from "node:util";

const args = parseArgs({
  options: {
    day: { type: "string" },
    workspace: { type: "string" },
    live: { type: "boolean", default: false }
  },
});

const dayMap = {
  mon: "2026-06-15",
  tue: "2026-06-16",
  wed: "2026-06-17",
  thu: "2026-06-18",
  fri: "2026-06-19",
  sat: "2026-06-20",
  sun: "2026-06-21",
};

const dayStr = args.values.day?.toLowerCase();
const datePrefix = dayMap[dayStr] || "2026-06-15"; // default to Monday

// We simulate 10:00 AM KST = 01:00:00Z UTC
const now = `${datePrefix}T01:00:00Z`;

async function run() {
  const token = process.env.CRON_SECRET;
  if (!token) {
    console.error("❌ CRON_SECRET 환경변수가 없습니다. (예: CRON_SECRET=... node scripts/test-team-checkin.mjs)");
    process.exit(1);
  }
  
  const payload = {
    dryRun: !args.values.live,
  };
  
  if (args.values.day) {
    payload.now = now;
  }
  
  if (args.values.workspace) {
    payload.workspaceId = args.values.workspace;
  }

  const isTimeTravel = !!args.values.day;
  const timeDesc = isTimeTravel ? `[시간 여행] ${dayStr.toUpperCase()}요일 10:00 AM (${now})` : `[현재 시스템 시간]`;
  console.log(`🚀 팀 체크인 발송 테스트 실행...`);
  console.log(`⏰ 설정된 시간: ${timeDesc}`);
  console.log(`🔔 FCM 푸시 알림 발송 모드: ${args.values.live ? "ON (실제 발송)" : "OFF (DB에만 기록)"}`);
  console.log(`-----------------------------------`);

  try {
    const res = await fetch("http://localhost:4000/api/internal/team-checkins/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`❌ 에러 발생: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(text);
      process.exit(1);
    }

    const data = await res.json();
    console.log(`✅ 실행 완료!`);
    console.dir(data, { depth: null, colors: true });
    
    if (data.createdDeliveryCount > 0) {
      console.log(`\n🎉 알림이 ${data.createdDeliveryCount}건 새로 생성되었습니다!`);
      console.log(`👉 화면(대시보드 또는 Inbox)을 새로고침해서 생성된 알림을 확인해보세요.`);
    } else {
      console.log(`\nℹ️ 조건에 맞는 발송 대상이 없어 알림이 생성되지 않았습니다.`);
    }

  } catch (err) {
    console.error("❌ 요청 실패 (개발 서버가 켜져 있는지 확인하세요):", err.message);
  }
}

run();
