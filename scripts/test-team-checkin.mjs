#!/usr/bin/env node
import { parseArgs } from "node:util";

const args = parseArgs({
  options: {
    day: { type: "string" },
    workspace: { type: "string" },
    live: { type: "boolean", default: false }
  },
});

function getCurrentWeekDates() {
  const now = new Date();
  const day = now.getDay();
  // Monday is 1, Sunday is 0. If Sunday, diff is -6, else 1
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  
  const dates = {};
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates[days[i]] = `${yyyy}-${mm}-${dd}`;
  }
  return dates;
}

const dayMap = getCurrentWeekDates();

const daysArr = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const todayStr = daysArr[new Date().getDay()];

const dayStr = args.values.day?.toLowerCase() || todayStr;
const datePrefix = dayMap[dayStr];

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
    now: now // Always simulate 10:00 AM KST
  };
  
  if (args.values.workspace) {
    payload.workspaceId = args.values.workspace;
  }

  const isTimeTravel = !!args.values.day;
  const timeDesc = isTimeTravel ? `[시간 여행] ${dayStr.toUpperCase()}요일 10:00 AM (${now})` : `[현재 시스템 날짜 기준] 오전 10:00 시뮬레이션 (${now})`;
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
