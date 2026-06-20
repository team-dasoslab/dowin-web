#!/usr/bin/env node

async function run() {
  const token = process.env.CRON_SECRET;
  if (!token) {
    console.error("❌ CRON_SECRET 환경변수가 없습니다. (예: CRON_SECRET=... node scripts/test-billing-revocation.mjs)");
    process.exit(1);
  }

  console.log(`🚀 결제/프로모션 만료 처리(Billing Revocation) 스크립트 실행...`);
  console.log(`-----------------------------------`);

  try {
    const res = await fetch("http://localhost:4000/api/internal/billing-revocation/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
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

    if (data.expiredCount > 0) {
      console.log(`\n🎉 총 ${data.expiredCount}개의 워크스페이스가 만료 처리(EXPIRED) 되었습니다!`);
    } else {
      console.log(`\nℹ️ 현재 시간 기준으로 만료 처리할 워크스페이스가 없습니다.`);
    }

  } catch (err) {
    console.error("❌ 요청 실패 (로컬 Next.js 서버가 켜져 있는지 확인하세요):", err.message);
  }
}

run();
