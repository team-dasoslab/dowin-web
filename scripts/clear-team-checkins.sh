#!/bin/bash
echo "🧹 로컬 DB에서 팀 체크인 발송 데이터를 모두 삭제합니다..."
npx wrangler d1 execute wig-db --local --command "DELETE FROM team_checkin_deliveries;"
echo "✅ 삭제 완료!"
