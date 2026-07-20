#!/usr/bin/env node

async function run() {
  const token = process.env.CRON_SECRET;
  if (!token) {
    console.error("❌ CRON_SECRET 환경변수가 없습니다. (예: CRON_SECRET=... node scripts/run-github-backfill.mjs)");
    process.exit(1);
  }
  
  console.log(`🚀 GitHub 연동 백필 (Workspace Prefix & Action Item Public ID) 실행...`);
  console.log(`-----------------------------------`);

  try {
    const res = await fetch("http://localhost:4000/api/internal/github-backfill", {
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

  } catch (err) {
    console.error("❌ 요청 실패 (개발 서버가 켜져 있는지 확인하세요):", err.message);
  }
}

run();
