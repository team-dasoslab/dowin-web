# Dowin 온보딩 가이드

이 문서는 새로운 개발자나 AI Agent가 Dowin 저장소에 바로 투입될 수 있도록 현재 상태, 읽기 순서, 핵심 파일 위치, 작업 규칙, 검증 방법을 한 번에 정리한 시작 문서다.  
이 문서 하나를 먼저 읽고, 여기서 안내하는 다음 문서와 파일만 따라가면 된다.

## 1. 프로젝트 한 줄 요약

Dowin는 4DX(가중목, 선행지표, 점수판, 책무) 개념으로 개인 또는 소규모 팀의 목표 실행을 관리하는 서비스다.  
핵심 사용자 흐름은 다음과 같다.

1. 로그인
2. 워크스페이스 생성 또는 참가
3. 활성 점수판 생성
4. 선행지표 추가
5. 대시보드에서 날짜별 O/X 기록
6. 이번 주 승패를 점수판 형태로 확인

## 2. 현재 상태 요약 (2026-04-28 기준)

### 2.1. 구현 완료

- Auth 핵심 백엔드와 프론트 연동 완료
- 공개 회원가입(Self-signup) 및 가입 직후 세션 발급 완료
- 회원가입 시 복원코드(8개) 1회 발급 및 가입 직후 저장 UX 구현 완료
- 복원코드 기반 계정 조회/비밀번호 재설정 API 및 로그인 화면 복구 탭 구현 완료
- Workspace 핵심 백엔드와 일부 프론트 연동 완료
- Workspace 초대코드 기반 참가 백엔드 구현 완료 (`join-by-invite`, 초대코드 발급/활성화 관리)
- 워크스페이스 없음 상태에서 `새 워크스페이스 만들기` / `초대코드로 참가하기` 셀프서브 CTA 제공 완료
- Scoreboard / Lead Measure / Daily Log 백엔드 핵심 API 구현 완료
- 점수판 보관함 UI 및 점수판 재활성화 흐름 구현 완료
- `dashboard/my`는 실제 API와 연동 완료
- `dashboard` 팀 뷰는 실제 API와 연동 완료
- `dashboard/my` 주간 점수판에서 `미기록 <-> O` 토글 가능
- Daily Log는 낙관적 업데이트 + 실패 롤백 적용 완료
- `dashboard/my` 상단 주간/월간 달성률 노출 완료
- 팀 대시보드 멤버 카드에 주간/월간 달성률 노출 완료
- 팀 대시보드 사용자별 메모 조회/생성/완료/삭제 및 메모 레일 UI 구현 완료
- Profile `GET /api/users/me`, `PUT /api/users/me`, `DELETE /api/users/me` 구현 완료
- 프로필 preset avatar 선택 및 저장 완료
- 닉네임 변경 시 DB 저장 및 프로필 재조회 완료
- 프로필에서 워크스페이스 이름 변경, 멤버 관리 진입, CSV export 진입 가능
- 프로필에서 서비스 탈퇴 전용 화면 진입 및 비밀번호 확인 기반 계정 삭제 가능
- 프로필에서 MEMBER 기준 워크스페이스 탈퇴 가능
- 프로필에서 ADMIN 기준 워크스페이스 삭제 가능
- 멤버 관리 화면에서 관리자 권한 이전 가능
- `/updates` 새 기능 모아보기 허브 구현 완료
- 비로그인 사용자용 서비스 소개형 루트 랜딩 페이지(`/`)의 카피 전면 개편 완료 (B2B 지향적이고 후킹한 어조 도입, 4DX 전문 용어 거부감 최소화, '시작하기'로 CTA 간결화)
- 제품 전반 용어 기준을 `핵심 목표 / 성공 기준 / 액션 아이템 / 점수판`으로 정리 완료
- Setup / 대시보드 / 리포트 / 랜딩 핵심 번역 카피에 위 용어 기준 1차 반영 완료
- 랜딩 Hero 비교용 variant preview 지원 완료
  - `/{locale}?variant=1|2|3` 로 Hero 헤드라인/서브카피 비교 가능
- Analytics export API와 프로필 CSV 다운로드 화면 구현 완료
- 푸시 구독 토글 및 개인 기록 리마인드 시간 설정 구현 완료
- WebView bridge 웹 타입 정리 및 `@webview-bridge/web` 연동 경로 정리 완료
- 로그인 직후 `dashboard/my` 첫 진입 시 알림 권한 요청 트리거 추가 완료
  - 정책: 앱(WebView) 환경에서만 동작하며, 로그인 흐름당 1회만 요청
- WebView bridge / native-web handoff 전용 로컬 스킬 `frontend-webview` 추가 완료
- 앱 클라이언트에서는 billing/export/`STANDARD` 중심 유료 노출을 숨기고 무료 핵심 흐름 중심으로 보이도록 앱 전용 UI 분기 적용 완료
- 선행지표 상세 화면 제거 완료
- API 라우트 dynamic slug는 `id` 기준으로 정리 완료
- `getSession(db)`는 실제 Drizzle DB 타입 기준으로 동작하도록 정리 완료
- 대시보드 주간 날짜 계산은 클라이언트 KST 기준으로 보정 완료
- `dashboard/my` 기간 탐색(`view`, `date` query)과 축하 confetti 인터랙션 구현 완료
- Setup 선행지표 횟수 입력 제한 적용 완료 (`WEEKLY` 최대 7회, `MONTHLY`는 점수판 시작월 최대 일수 기준)
- Setup 점수판 생성 화면에 4DX 용어 코치마크(가중목/후행지표/선행지표) 적용 완료
  - `react-joyride` 기반 3단계 안내
  - 로컬 스토리지(`dowin.setup.coachmark.v1.dismissed`) 기준 1회 노출
- Free 플랜 기록 조회 6개월 제한 백엔드/프론트엔드 동시 적용 완료
- 히스토리 제한 구역(6개월 이전) 접근 시 블러 처리 및 '비공개' 오버레이 UI 구현 완료
- 대시보드 네비게이션 `useTransition` 연동 및 데이터 조회 중 상호작용 비활성화(연타 방지) 완료
- 주간 보기 시 6개월 제한 경계 주차(Overlap)에 대한 유연한 조회 허용 로직 적용 완료
- Billing `GET /api/billing/me`, `POST /api/billing/checkout`, `GET /api/billing/portal`, `POST /api/webhooks/polar` 라우트 초안 구현 완료
- Polar sandbox checkout과 webhook 반영 기준 `STANDARD` 플랜 전환 확인 완료
- 프로필 billing 화면에서 현재 플랜, billing 상태, 업그레이드 CTA, 결제 관리 CTA 노출 완료
- 반복 `refund/revoked` 이력에 대한 최근 30일 위험 신호 집계와 `BILLING_REVIEW_REQUIRED` 차단 규칙 1차 적용 완료
- billing 화면에 수동 검토 필요 배너 및 위험 신호 상태 표시 추가 완료
- Polar customer portal 디버깅 결과, pre-authenticated portal session에는 `customer_sessions:write` scope가 있는 `POLAR_ACCESS_TOKEN`이 별도로 필요함을 확인 완료

### 2.2. 아직 남은 것

- 무료 가치 측정을 위한 이벤트 로그/지표 정의와 파일럿 관찰 체계 미구현
- GA4 기반 일일 Discord 운영 리포트는 포맷 계약까지만 앱 저장소에 반영됐고, 실제 `GA4 Data API -> 집계 -> Discord 발송` 실행은 별도 스케줄러 워커에서 담당하도록 분리 예정이다
- 대시보드 차트/시각화 고도화 미완료
- 프로필 탈퇴 UX는 구현됐지만 닉네임/워크스페이스 이름 변경은 여전히 `prompt` 기반이다
- 첫 진입 온보딩 문구/CTA 용어 일관성(`워크스페이스` 중심) 정리는 진행 중이다
- 제품 전반 용어 기준은 정리됐지만, 법률 문서/업데이트 히스토리/비핵심 카피까지 전면 치환하는 작업은 아직 남아 있다
- 앱 전용 푸시 전환 이후 개인 기록 리마인드의 실제 반응률과 후속 기록 재개율은 운영 데이터로 검증이 더 필요하다
- 웹 브라우저에서는 알림을 지원하지 않고, 앱(WebView)에서만 네이티브 권한 + FCM 토큰 등록 흐름을 사용한다
- 프로필 알림 토글은 앱 환경에서 현재 기기 FCM 토큰을 서버에 등록/비활성화한다
- 유료 기능 후보는 `달성률 임계치 기반 자동 리마인드`보다 `리더 액션 어시스턴트` 중심으로 재정의했다. 핵심은 자동 꾸짖기가 아니라 `위험 신호 감지 -> 자동 운영 체크인 발송 -> 팀원 1탭 반응 -> 체크인 결과 보고 -> 후속 변화 확인`이며, 팀원 수용성/알림 피로 가드레일까지 포함해 `docs/planning/2026.04.14-leader-report-reminder-plan.md`를 본다
- Polar customer portal 진입은 코드에서 `POLAR_ACCESS_TOKEN` fallback 지원까지 반영됐지만, 실제 sandbox 환경에는 `customer_sessions:write` scope가 있는 토큰 설정이 아직 필요하다
- 환불 악용 방지 문서 기준의 `STANDARD` usage event 저장은 아직 미구현이며, 결제 운영을 계속할 거면 우선순위를 높여 반드시 구현해야 한다
  - 이유:
    - 지금은 반복 환불/취소 이력 1차 차단까지만 가능하고, `결제 후 실제로 핵심 유료 기능을 얼마나 썼는지`를 코드로 판정할 수 없다
    - 문서상 환불 예외 판단 기준을 실제 운영 로직으로 연결하려면 `STANDARD` usage ledger가 필요하다
  - 함께 남은 후속:
    - 반복 환불 이력의 운영 알림/수동 검토 흐름 고도화
- `/profile/contact` 기준의 서비스 내부 문의 MVP는 구현 완료됐다
  - 포함 범위:
    - 문의 접수 폼
    - Discord 운영 알림
    - 로그인 사용자의 자기 문의 목록/상세 조회
  - `/contact`는 직접 폼을 렌더링하지 않고 로그인 상태에 따라 `/login` 또는 `/profile/contact`로 유도한다
  - 기준 문서: `docs/planning/2026.05.01-in-product-contact-plan.md`
- 다국어(i18n)는 `next-intl` + URL locale 세그먼트 방식으로 동작한다
  - 서버 locale 우선순위:
    - `X-DOWIN-Locale`
    - `NEXT_LOCALE`
    - `Accept-Language`
    - 기본값 `ko`
  - 로그인 사용자가 다른 locale 경로로 들어오면 미들웨어가 같은 경로의 locale prefix만 교정한다
  - 관련 구현 시작점:
    - `middleware.ts`
    - `src/i18n/detect-locale.ts`
    - `src/lib/server/locale.ts`

### 2.3. 현재 우선순위 (2026-04-30 기준)

- 단기 우선순위는 `강한 Free 제한 추가`보다 `STANDARD 유료 가치 강화`다.
- 그 범용화에는 제품 전반의 4DX 책 용어를 책 비독자도 이해할 수 있는 범용 제품 언어로 재정리하는 작업이 포함된다.
- 공개 회원가입과 워크스페이스 셀프서브 진입은 현재 동작 중이며, 다음 우선순위는 운영 마감 기능과 무료 가치 측정 체계를 보강하는 것이다.
- 현재 기준에서는 모든 워크스페이스를 `FREE`로 운영하되, 제한을 더 세게 늘리기보다 `STANDARD`의 핵심 결제 이유를 선명하게 만드는 쪽을 우선한다.
- 그 핵심은 `리더 액션 어시스턴트` 계열 기능이며, 구체적으로는 `위험 신호 감지 -> 자동 운영 체크인 발송 -> 팀원 1탭 반응 -> 체크인 결과 보고 -> 후속 변화 확인` 흐름이다.
- Free 플랜 구조와 최소 제한은 유지하되, 다음 유료화 작업의 중심은 `자동 운영 체크인 + 체크인 결과 리포트`로 둔다.
- 팀 회의/회고 흐름은 별도 미팅 모드보다 팀 대시보드 메모 레일로 운영한다.
- 무료 가치 측정 지표, 온보딩 카피 일관성, 계정 탈퇴 같은 잔여 운영 기능을 다음 제품 축으로 본다.
- 용어 범용화는 내부 모델을 지우는 작업이 아니라, 사용자 노출 카피와 설명 레이어를 재설계하는 작업으로 본다.
- 현재 확정된 사용자 노출 기본 용어는 `핵심 목표 / 성공 기준 / 액션 아이템 / 점수판`이다.
- 랜딩은 단순 용어 치환만으로 끝내지 않고, `누가 봐도 어떤 제품인지 이해되는 카피`로 별도 다듬는 것을 다음 우선 작업으로 둔다.
- 초대코드 만료 시간 정책과 다중 워크스페이스는 당장 우선순위에 올리지 않는다.
- 결제/청구 구현은 별도 축이지만, `무엇을 사게 만들 것인가`에 대한 제품 가치는 `STANDARD` 기능 묶음 강화와 함께 먼저 선명해져야 한다.
- 운영 기본기 측면에서 외부 `Tally` 의존 문의 흐름은 내부 문의 저장 + Discord 운영 알림 + 사용자 문의 결과 조회 구조로 전환 완료됐다.
- 다음 운영 후속은 운영자 처리 도구와 정책 문구 정렬이다.

### 2.3.1. 루트 엔트리 상태

- 루트 경로(`/`)는 비로그인 사용자에게 서비스 소개형 랜딩 페이지를 노출한다.
- 로그인 화면은 `/login` 경로로 분리되었다.
- 로그인 사용자가 `/` 또는 `/login`에 접근하면 기존처럼 `/dashboard/my`로 리다이렉트된다.
- 랜딩은 책 내용을 직접 요약하는 페이지가 아니라, Dowin가 해결하는 실행 문제와 제품 구조를 제품 언어로 설명하는 입구로 유지한다.
- 현재 Hero 카피 비교를 위해 `/{locale}?variant=1|2|3` 프리뷰를 지원한다.
- 아직 최종 Hero 문구는 확정 전이며, 랜딩 본문도 추가 카피 다듬기가 남아 있다.
- 관련 기준 문서:
  - `docs/planning/2026.03.24-root-landing-page-plan.md`
  - `docs/planning/2026.04.28-product-language-dictionary-and-copy-map.md`

### 2.3.2. 워크스페이스 없음 상태 처리 규칙

- `GET /api/workspaces/me`가 `404`를 반환하면 에러가 아니라 정상 온보딩 상태로 처리한다.
- 프론트는 아래 2개 CTA를 동시에 제공한다.
  - `새 워크스페이스 만들기` (`POST /api/workspaces`)
  - `초대코드로 참가하기` (`POST /api/workspaces/join-by-invite`)
- `GET /api/workspaces/me`가 `200`이면 기존 대시보드로 진입한다.

### 2.4. 현재 검증 기준

- `yarn tsc --noEmit` 통과
- `yarn lint` 통과
- `yarn test --run` 통과
- Storybook browser 테스트는 기본 `yarn test`에 포함되지 않고 `yarn test:storybook --run`으로 분리되어 있다
- `AGENTS.md`, `codex.md`, `.agents/skills/**` 같은 하네스 파일이 바뀌면 머지 전 `dowin-harness-security-check`를 추가로 수행한다

## 3. 기술 스택

- Framework: Next.js 16 App Router
- UI: React 19, Tailwind CSS 4, Lucide React
- API 계약: OpenAPI, Orval
- 서버 상태: TanStack Query v5
- 검증: Zod
- DB: Cloudflare D1 + Drizzle ORM
- 테스트: Vitest
- UI 문서화: Storybook
- 배포: OpenNext + Cloudflare
- 패키지 매니저: Yarn 4.10.0

### 3.1. 현재 배포 운영 방식

- `main`은 개발 통합 브랜치다.
- `production`은 Cloudflare 자동 배포 브랜치다.
- 실제 운영 반영은 `main -> production` PR 머지로만 진행한다.
- `production` PR은 `PR CI`와 `Production DB Migration Check`를 통과해야 머지한다.
- 이 구조를 쓰는 이유는 문서 수정이나 내부 정리 커밋이 `main`에 들어가도 곧바로 프로덕션 배포되지 않게 하기 위해서다.
- `production` PR 단계에서는 검증용 D1 DB에 migration check를 수행한다.
- `production` PR이 merge되면 GitHub Actions `Production DB Migration` 워크플로가 production DB migration을 자동 적용한다.
- 해당 워크플로는 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` GitHub Secrets를 사용한다.
- `production` PR migration check는 GitHub Actions variable `D1_MIGRATION_CHECK_DATABASE`와 `wrangler.jsonc`의 검증용 D1 바인딩을 사용한다.
- 현재는 PR 단계 migration 검증과 merge 후 production DB migration, Cloudflare Git integration 배포가 각각 자동화되어 있다.
- 자세한 운영 배경과 설정 링크는 `docs/dev/common/2026.04.19-production-deployment-flow.md`를 본다.

## 4. 가장 먼저 읽을 문서

작업 시작 시 아래 순서를 기본으로 따른다.

1. 이 문서 `docs/onboarding.md`
2. 작업 유형별 스킬
   - 오케스트레이션/작업 분류: `.agents/skills/orchestrator/SKILL.md`
   - 프론트엔드: `.agents/skills/frontend/SKILL.md`
   - WebView 프론트엔드: `.agents/skills/frontend-webview/SKILL.md`
   - 백엔드: `.agents/skills/backend/SKILL.md`
   - 기획/문서: `.agents/skills/planning/SKILL.md`
   - 운영/장애 대응: `.agents/skills/operations/SKILL.md`
   - 품질 점검: `.agents/skills/quality-check/SKILL.md`
   - 성능 점검: `.agents/skills/performance-check/SKILL.md`
   - 보안 점검: `.agents/skills/security-check/SKILL.md`
   - 하네스 보안 점검: `.agents/skills/harness-security-check/SKILL.md`
   - 제품 업데이트: `.agents/skills/product-updates/SKILL.md`
3. 전체 도메인 개요
   - `docs/dev/common/2026.03.12-domain-overview.md`
   - 운영 사고 대응 준비: `docs/planning/2026.04.19-production-incident-readiness-plan.md`
   - 운영 문서 시작점: `docs/dev/operations/README.md`
4. 관련 도메인 설계 문서
   - 예: `docs/dev/daily-log/2026.03.12-domain-daily-log.md`
   - 예: `docs/dev/dashboard/2026.03.12-domain-dashboard.md`
   - 예: `docs/dev/lead-measure/2026.04.13-backend-tag-design.md`
5. 관련 도메인 구현 결과 문서
   - 예: `docs/dev/scoreboard/2026.03.16-backend.md`
   - 예: `docs/dev/scoreboard/2026.03.16-frontend.md`
   - 예: `docs/dev/auth/2026.03.14-backend.md`
   - 예: `docs/dev/auth/2026.03.14-frontend.md`
   - 예: `docs/dev/daily-log/2026.03.15-backend.md`
   - 예: `docs/dev/daily-log/2026.03.15-frontend.md`
   - 예: `docs/dev/dashboard/2026.03.15-frontend.md`
   - 예: `docs/dev/profile/2026.03.16-backend.md`
   - 예: `docs/dev/profile/2026.03.16-frontend.md`
6. 전략/우선순위 문서 (필요 시)
   - 루트 랜딩 페이지 전환안: `docs/planning/2026.03.24-root-landing-page-plan.md`
   - 서비스 기획 개요: `docs/planning/2026.03.09-service-overview.md`
   - 제품 용어 사전 + 화면별 카피 적용표: `docs/planning/2026.04.28-product-language-dictionary-and-copy-map.md`
   - 범용 마케팅 방법론 조사: `docs/planning/2026.04.19-marketing-methodology-research.md`
   - 초기 마케팅 방법론: `docs/planning/2026.04.19-marketing-methodology-plan.md`
   - 선행지표 태그 확장안: `docs/planning/2026.04.10-lead-measure-tag-plan.md`
   - 책 기준 정렬 점검 및 우선순위 재정의: `docs/planning/2026.04.13-book-alignment-priority-plan.md`
   - Free 플랜 초기 제한안: `docs/planning/2026.04.14-free-plan-initial-limits-plan.md`
     - 현재 우선순위상 출시 전 선행 적용 대상
   - Polar 결제 MVP 설계안: `docs/planning/2026.04.18-polar-billing-mvp-plan.md`
     - 로컬 sandbox checkout, tunnel URL, 테스트 카드 입력 예시, 환불/chargeback 방어 원칙 포함
   - 알림 스케줄 커스터마이즈: `docs/planning/2026.04.14-notification-schedule-customization-plan.md`
   - Slack/Discord 봇 연동 확장안: `docs/planning/2026.04.18-slack-discord-bot-integration-plan.md`
   - 범용화 + 무료 가치 우선 로드맵: `docs/planning/2026.03.24-monetization-generalization-roadmap.md`
   - 수익화 전략: `docs/planning/2026.03.18-monetization-strategy.md`
   - 커밋 컨벤션 정리: `docs/planning/2026.04.09-commit-convention.md`
   - 성능 최적화 포인트: `docs/dev/performance/2026.03.17-optimization-points.md`
   - 성능 측정 기준선: `docs/dev/performance/2026.03.17-baseline.md`
   - 성능 측정 리포트: `docs/dev/performance/2026.03.17-measurement-report.md`
   - 운영 사고 대응 준비 계획: `docs/planning/2026.04.19-production-incident-readiness-plan.md`
7. 마지막으로 실제 구현 파일

원칙은 단순하다.  
문서가 코드와 다르면 현재 구현 파일을 우선 확인하고, 문서를 그에 맞춰 갱신한다.

## 5. 저장소 구조와 어디를 보면 되는지

### 5.1. 프론트엔드

- `src/app/page.tsx`
  - 비로그인 사용자용 랜딩 페이지 엔트리
  - 기준 문서: `docs/planning/2026.03.24-root-landing-page-plan.md`
- `src/app/login/page.tsx`
  - 기존 로그인/회원가입 엔트리
- `src/app/account-recovery/page.tsx`
  - 복원코드 기반 계정 복구 페이지
- `src/app/(protected)/dashboard/my/page.tsx`
  - 내 대시보드
- `src/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard.ts`
  - 내 대시보드 API 조회/토글 로직
- `src/lib/bridge.ts`
  - WebView bridge 연결, 알림 권한/토큰/앱 버전 helper, 네이티브 메서드 래퍼
- `src/types/bridge.ts`
  - 웹에서 사용하는 bridge 공개 타입
- `src/components/bridge/BridgeInitializer.tsx`
  - bridge store를 구독해 safe area와 deep link를 초기화하는 클라이언트 엔트리
- `src/app/(protected)/scoreboards/page.tsx`
  - 점수판 보관함 화면
- `src/app/(protected)/scoreboards/_hooks/useScoreboardArchive.ts`
  - 점수판 보관함 상태 전환 로직
- `src/app/(protected)/dashboard/page.tsx`
  - 팀 대시보드, 실제 API 연동 완료
- `src/app/(protected)/setup/page.tsx`
  - 점수판/선행지표 설정 화면, 4DX 용어 코치마크와 선행지표 태그 관리 포함
- `src/app/(protected)/setup/_hooks/useScoreboardSetup.ts`
  - 점수판 설정, 선행지표 태그 생성/수정/삭제, 낙관적 업데이트 로직
- `src/app/(protected)/profile/page.tsx`
  - 프로필 홈, 비밀번호 변경, 워크스페이스/데이터/앱 탐색 메뉴
  - MEMBER는 워크스페이스 탈퇴, ADMIN은 워크스페이스 삭제 가능
- `src/app/(protected)/profile/avatar/page.tsx`
  - preset avatar 선택 화면
- `src/app/(protected)/profile/members/page.tsx`
  - 관리자용 멤버 조회 / 퇴출 / 관리자 권한 이전 화면
- `src/app/(protected)/profile/invites/page.tsx`
  - 관리자용 초대코드 생성 / 상태관리 화면
- `src/app/(protected)/profile/export/page.tsx`
  - CSV export 화면
- `src/app/(protected)/updates/page.tsx`
  - 새 기능 모아보기 허브
- `src/app/api/users/me/route.ts`
  - 내 프로필 조회 / 닉네임 + avatar 변경 API
- `src/components/ui/*`
  - 공통 UI 컴포넌트
- `src/context/ToastContext.tsx`
  - 토스트 피드백

### 5.2. API / 생성 코드

- `src/api-spec/openapi.yaml`
  - API 계약의 단일 진실 원천
- `src/api/generated/**`
  - Orval 생성 훅과 타입
- `src/api/mutator.ts`
  - 공통 요청 처리, 세션 쿠키 포함

### 5.3. 백엔드

- `src/app/api/**`
  - Next Route Handlers
- `src/domain/<domain>/services/*`
  - 비즈니스 로직
- `src/domain/<domain>/storage/*`
  - DB 접근
- `src/domain/<domain>/validation.ts`
  - Zod 입력 검증
- `src/lib/server/auth.ts`
  - 세션 조회 유틸
- `src/lib/server/api-response.ts`
  - 표준 성공/에러 응답
- `src/lib/server/with-error-handler.ts`
  - 공통 에러 처리 래퍼
- `src/db/schema.ts`
  - Drizzle 스키마
- `src/db/index.ts`
  - `getDb` 진입점

## 6. 도메인별 현재 구현 상태

### 6.1. Auth

- `POST /api/auth/signup` 공개 회원가입 구현
- 로그인, 로그아웃, 비밀번호 변경 동작
- 복원코드 기반 계정 조회 / 비밀번호 재설정 구현
- 세션 쿠키 이름은 `dowin_sid`
- 관리자용 사용자 생성 API 존재
- 프론트 연동도 기본 완료

관련 문서:

- `docs/dev/auth/2026.03.12-domain-auth.md`
- `docs/dev/auth/2026.03.14-backend.md`
- `docs/dev/auth/2026.03.14-frontend.md`

### 6.2. Workspace

- 내 워크스페이스 조회 API 구현
- 워크스페이스 생성 API 구현
- 워크스페이스 참가 API 구현
- 워크스페이스 초대코드 발급/조회/상태변경 API 구현 (ADMIN)
- 초대코드 기반 참가 API 구현 (`POST /api/workspaces/join-by-invite`)
- 멤버 조회 API 구현
- 워크스페이스 이름 수정 API 구현
- 워크스페이스 탈퇴 API 구현
- 워크스페이스 삭제 API 구현
- 관리자 권한 이전 API 구현
- 멤버 퇴출 API 구현
- 대시보드에서 워크스페이스 없음 상태 처리 완료
- 초대코드 정책(현재): 사용 횟수(`maxUses`) 기반, 상태 토글(`ACTIVE`/`INACTIVE`) 지원

관련 문서:

- `docs/dev/workspace/2026.03.12-domain-workspace.md`
- `docs/dev/workspace/2026.03.14-backend.md`
- `docs/dev/workspace/2026.03.14-frontend.md`

### 6.3. Scoreboard

- 활성 점수판 조회 구현
- 생성 / 수정 / 아카이브 / 재활성화 API 구현
- `setup` 화면에서 보관 후 새 점수판 생성 또는 기존 점수판 재활성화 가능
- `scoreboards` 보관함 화면에서 전체 점수판 조회 및 상태 변경 가능

관련 문서:

- `docs/dev/scoreboard/2026.03.12-domain-scoreboard.md`
- `docs/dev/scoreboard/2026.03.16-backend.md`
- `docs/dev/scoreboard/2026.03.16-frontend.md`

### 6.4. Lead Measure

- 목록 조회 / 생성 / 수정 / 삭제 / 보관 / 재활성화 구현
- 프론트는 setup 화면 일부와 daily-log 조회에서 사용
- 선행지표 전용 상세 화면은 제거되었고, 현재는 setup 및 dashboard 흐름에 집중한다

관련 문서:

- `docs/dev/lead-measure/2026.03.12-domain-lead-measure.md`

### 6.5. Daily Log

- `PUT /api/lead-measures/:id/logs/:date`
- `DELETE /api/lead-measures/:id/logs/:date`
- `GET /api/scoreboards/:id/logs/weekly`
- `GET /api/scoreboards/:id/logs/monthly`
- `dashboard/my` 연동 완료
- 낙관적 업데이트와 실패 롤백 적용 완료

관련 문서:

- `docs/dev/daily-log/2026.03.12-domain-daily-log.md`
- `docs/dev/daily-log/2026.03.15-backend.md`
- `docs/dev/daily-log/2026.03.15-frontend.md`

### 6.6. Dashboard

- My View는 실제 API 연동 완료
- Team View는 실제 API 연동 완료
- `dashboard/my`는 `view`, `date` query 기반 주간/월간 탐색 지원
- 주간/월간 달성률 동시 노출 완료
- 주간 기록 달성 시 confetti 축하 인터랙션 적용
- 팀 뷰 사용자별 메모 레일과 메모 CRUD 연동 완료
- 차트/시각화는 미완성

관련 문서:

- `docs/dev/dashboard/2026.03.12-domain-dashboard.md`
- `docs/dev/dashboard/2026.03.15-frontend.md`

### 6.7. Profile

- 내 프로필 조회 API 구현
- 닉네임 / avatar 변경 API 구현
- 프로필 화면은 실제 `me` API 연동 완료
- 비밀번호 변경은 Auth API 사용
- 워크스페이스 이름 변경, 멤버 관리, CSV export, 설치 가이드, 업데이트 허브 진입점을 제공한다
- 서비스 탈퇴는 별도 `/profile/delete-account` 화면에서 현재 비밀번호 확인 후 진행한다

### 6.8. Notification / Push

- `/api/notifications/devices`, `/api/push/send-daily` 라우트 존재
- 프로필 화면에서 앱 전용 푸시 알림 토글 제공
- 일일 기록 리마인드가 구현되어 있다
- OpenAPI 계약에는 아직 포함되지 않은 보조 API다

관련 문서:

- `docs/dev/notification/2026.03.12-domain-notification.md`

### 6.9. Analytics / Export

- `GET /api/analytics/export-data` 구현
- 프로필의 CSV 다운로드 화면이 이 API를 사용한다
- 아직 별도 analytics 대시보드 제품으로 확장되지는 않았다

관련 문서:

- `docs/dev/analytics/2026.03.12-domain-analytics.md`

관련 문서:

- `docs/dev/profile/2026.03.12-domain-profile.md`
- `docs/dev/profile/2026.03.16-backend.md`
- `docs/dev/profile/2026.03.16-frontend.md`

## 7. 작업 규칙

### 7.1. 공통

- Yarn만 사용한다
- 문서보다 현재 구현이 우선이다
- 변경 범위와 맞는 최소 문서만 읽는다
- 새 구조를 만들기 전에 기존 패턴을 재사용한다

### 7.2. 프론트엔드

- 공통 UI는 `src/components/ui`를 먼저 재사용한다
- `Button`이 `Link`를 감싸면 `asChild`를 사용한다
- React 19이므로 새 `forwardRef` 래퍼를 기본 선택으로 만들지 않는다
- 서버 상태는 생성된 Orval 훅 + TanStack Query로 다룬다
- mutation 후 관련 query invalidate를 빼먹지 않는다
- 로딩 / 빈 상태 / 에러 상태를 명시적으로 처리한다

### 7.3. 백엔드

- 새 API나 계약 변경은 `src/api-spec/openapi.yaml`을 먼저 수정한다
- Route -> Service -> Storage 책임 분리를 유지한다
- 요청 검증은 Zod를 사용한다
- 응답은 `apiSuccess`, `apiError`, `withErrorHandler` 패턴을 따른다
- 인증 필요한 API는 `getSession(db)`를 사용한다

## 8. 자주 건드리는 핵심 파일

- `src/app/layout.tsx`
  - QueryClientProvider, ToastProvider 등록
- `src/api/mutator.ts`
  - 쿠키 인증과 응답 래핑 동작
- `src/lib/client/frontend-api.ts`
  - 프론트 공통 API 에러 처리 유틸
- `src/lib/server/auth.ts`
  - 세션 인증 유틸
- `src/app/(protected)/dashboard/my/_lib/week.ts`
  - 주간 날짜 계산 유틸

## 9. 로컬 실행과 검증

### 9.1. 기본 실행

```bash
yarn install
yarn dev
```

### 9.2. 자주 쓰는 명령어

```bash
yarn storybook
yarn test
yarn gen:api
yarn mig:local
```

### 9.3. 현재 권장 검증 방식

작업 범위에 맞는 최소 검증부터 하고, 영향 범위가 크면 전역 게이트까지 넓힌다.

프론트 변경 예시:

```bash
yarn eslint <changed-files>
```

백엔드 변경 예시:

```bash
yarn test --run <changed-test-file>
```

주의:

- `yarn test`는 콘솔 테스트 기준이다
- Storybook browser 테스트가 필요하면 `yarn test:storybook --run`을 별도로 사용한다

### 9.4. 머지 전 보안 점검

PR을 머지하기 전에는 자동 검증과 별개로 짧은 보안 점검을 한 번 거친다.

- 기준 문서: `docs/dev/common/2026.03.12-security.md`
- 인증: 보호 API에 `getSession(db)` 또는 동등한 세션 확인이 있는지
- 인가: ADMIN 전용 API와 멤버 전용 API의 경계가 맞는지
- 소유권: 리소스를 ID만으로 읽지 않고, 사용자/워크스페이스 조건까지 포함해 조회하는지
- 검증: 요청 body, params, query가 Zod 또는 기존 검증 경로로 확인되는지
- 민감정보: 비밀번호, 복원코드, 시크릿, 쿠키 값이 로그/에러 응답에 노출되지 않는지

하네스 관련 파일이 바뀐 PR이면 위 점검에 더해 `dowin-harness-security-check`도 수행한다.

- 대상 예시: `AGENTS.md`, `codex.md`, `.agents/skills/**`
- 확인 포인트: 비밀값 하드코딩, 과도한 권한 승인 지시, 위험 명령 정상화, 하네스 보안과 앱 보안의 역할 혼동

## 10. 현재 작업 시작 포인트 추천

작업 유형별로 보통 여기서 시작하면 된다.

- 로그인/세션 문제: `src/lib/server/auth.ts`, `src/app/api/auth/*`, `src/app/_components/LoginPageClient.tsx`
- 워크스페이스 상태 문제: `src/app/api/workspaces/*`, `src/app/(protected)/dashboard/my/page.tsx`
- Daily Log 기록 문제: `src/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard.ts`, `src/app/api/lead-measures/[id]/logs/[date]/route.ts`, `src/domain/daily-log/*`
- 점수판/선행지표 문제: `src/app/(protected)/setup/*`, `src/app/api/scoreboards/*`, `src/app/api/lead-measures/*`
- 프로필/설정 문제: `src/app/(protected)/profile/*`, `src/app/api/users/me/route.ts`, `src/domain/profile/*`
- 업데이트 허브 문제: `src/app/(protected)/updates/page.tsx`, `src/content/product-updates.ts`, `src/lib/product-updates.ts`
- 수익화/요금제 전략 검토: `docs/planning/2026.03.18-monetization-strategy.md`, `docs/planning/2026.03.09-service-overview.md`
- 성능 최적화 작업: `docs/dev/performance/2026.03.17-optimization-points.md`, `docs/dev/performance/2026.03.17-baseline.md`, `docs/dev/performance/2026.03.17-measurement-report.md`

## 11. 현재 가장 현실적인 다음 작업

우선순위는 아래 순서가 적절하다.

1. 전역 TypeScript 오류 정리
2. `yarn lint` 스크립트 정상화
3. 온보딩 문구/플로우 정리 (CTA 용어를 `워크스페이스` 중심으로 통일)
4. 대시보드 차트/시각화 고도화
5. Push/보조 API를 OpenAPI 계약 및 공통 응답 패턴으로 정리할지 결정
6. 탈퇴/계정 삭제 정책을 문서와 구현에서 함께 확정

## 12. 마지막으로 기억할 것

- 이 저장소는 문서가 비교적 잘 갖춰져 있지만, 일부 구현 속도가 문서보다 앞서 있다
- 작업 전에는 도메인 문서와 현재 코드를 둘 다 확인해야 한다
- 개인/팀 대시보드 핵심 흐름은 실제 API 기반이지만, 일부 보조 API는 아직 공통 규약/OpenAPI 밖에 있다
- 백엔드는 layered 구조가 잡혀 있으니, 새 로직도 같은 패턴으로 넣어야 한다
- 지금 가장 중요한 안정화 포인트는 타입 오류 정리, 검증 체계 복구, 보조 API 규약 정리다

---

API는 세션 쿠키 `dowin_sid`를 사용한다.  
로컬에서 인증/조회가 이상하면 쿠키 전달, `mutator.ts`, Cloudflare D1 바인딩 경로를 먼저 확인하면 된다.
