# WIG 온보딩 가이드

이 문서는 새로운 개발자나 AI Agent가 WIG 저장소에 바로 투입될 수 있도록 현재 상태, 읽기 순서, 핵심 파일 위치, 작업 규칙, 검증 방법을 한 번에 정리한 시작 문서다.  
이 문서 하나를 먼저 읽고, 여기서 안내하는 다음 문서와 파일만 따라가면 된다.

## 1. 프로젝트 한 줄 요약

WIG는 4DX(가중목, 선행지표, 점수판, 책무) 개념으로 개인 또는 소규모 팀의 목표 실행을 관리하는 서비스다.  
핵심 사용자 흐름은 다음과 같다.

1. 로그인
2. 워크스페이스 생성 또는 참가
3. 활성 점수판 생성
4. 선행지표 추가
5. 대시보드에서 날짜별 O/X 기록
6. 이번 주 승패를 점수판 형태로 확인

## 2. 현재 상태 요약 (2026-04-03 기준)

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
- 비로그인 사용자용 서비스 소개형 루트 랜딩 페이지(`/`) 구현 완료
- Analytics export API와 프로필 CSV 다운로드 화면 구현 완료
- 푸시 구독 토글, 매일 밤 9시 기록 리마인드, 매주 목요일 3시 집중 리마인드 구현 완료
- 선행지표 상세 화면 제거 완료
- API 라우트 dynamic slug는 `id` 기준으로 정리 완료
- `getSession(db)`는 실제 Drizzle DB 타입 기준으로 동작하도록 정리 완료
- 대시보드 주간 날짜 계산은 클라이언트 KST 기준으로 보정 완료
- `dashboard/my` 기간 탐색(`view`, `date` query)과 축하 confetti 인터랙션 구현 완료
- Setup 선행지표 횟수 입력 제한 적용 완료 (`WEEKLY` 최대 7회, `MONTHLY`는 점수판 시작월 최대 일수 기준)
- Setup 점수판 생성 화면에 4DX 용어 코치마크(가중목/후행지표/선행지표) 적용 완료
  - `react-joyride` 기반 3단계 안내
  - 로컬 스토리지(`wig.setup.coachmark.v1.dismissed`) 기준 1회 노출

### 2.2. 아직 남은 것

- 무료 가치 측정을 위한 이벤트 로그/지표 정의와 파일럿 관찰 체계 미구현
- 대시보드 차트/시각화 고도화 미완료
- 프로필 탈퇴 UX는 구현됐지만 닉네임/워크스페이스 이름 변경은 여전히 `prompt` 기반이다
- 첫 진입 온보딩 문구/CTA 용어 일관성(`워크스페이스` 중심) 정리는 진행 중이다
- Push 계열 보조 API는 OpenAPI 계약과 공통 응답 규약 정리가 아직 남아 있다

### 2.3. 현재 우선순위 (2026-04-03 기준)

- 단기 우선순위는 `유료화`가 아니라 `범용 서비스화 + 무료 가치 강화`다.
- 공개 회원가입과 워크스페이스 셀프서브 진입은 현재 동작 중이며, 다음 우선순위는 운영 마감 기능과 무료 가치 측정 체계를 보강하는 것이다.
- 팀 회의/회고 흐름은 별도 미팅 모드보다 팀 대시보드 메모 레일로 운영한다.
- 무료 가치 측정 지표, 온보딩 카피 일관성, 계정 탈퇴 같은 잔여 운영 기능을 다음 제품 축으로 본다.
- 초대코드 만료 시간 정책과 다중 워크스페이스는 당장 우선순위에 올리지 않는다.
- 유료화(결제/청구)는 무료 가치와 리텐션 신호가 확인된 이후 단계로 둔다.

### 2.3.1. 루트 엔트리 상태

- 루트 경로(`/`)는 비로그인 사용자에게 서비스 소개형 랜딩 페이지를 노출한다.
- 로그인 화면은 `/login` 경로로 분리되었다.
- 로그인 사용자가 `/` 또는 `/login`에 접근하면 기존처럼 `/dashboard/my`로 리다이렉트된다.
- 랜딩은 책 내용을 직접 요약하는 페이지가 아니라, WIG가 해결하는 실행 문제와 제품 구조를 제품 언어로 설명하는 입구로 유지한다.
- 관련 기준 문서:
  - `docs/planning/2026.03.24-root-landing-page-plan.md`

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
- `AGENTS.md`, `codex.md`, `.agents/skills/**` 같은 하네스 파일이 바뀌면 머지 전 `wig-harness-security-check`를 추가로 수행한다

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

## 4. 가장 먼저 읽을 문서

작업 시작 시 아래 순서를 기본으로 따른다.

1. 이 문서 `docs/onboarding.md`
2. 작업 유형별 스킬
   - 오케스트레이션/작업 분류: `.agents/skills/wig-orchestrator/SKILL.md`
   - 프론트엔드: `.agents/skills/wig-frontend/SKILL.md`
   - 백엔드: `.agents/skills/wig-backend/SKILL.md`
   - 기획/문서: `.agents/skills/wig-planning/SKILL.md`
   - 품질 점검: `.agents/skills/wig-quality-check/SKILL.md`
   - 성능 점검: `.agents/skills/wig-performance-check/SKILL.md`
   - 보안 점검: `.agents/skills/wig-security-check/SKILL.md`
   - 하네스 보안 점검: `.agents/skills/wig-harness-security-check/SKILL.md`
   - 제품 업데이트: `.agents/skills/wig-product-updates/SKILL.md`
3. 전체 도메인 개요
   - `docs/dev/common/2026.03.12-domain-overview.md`
4. 관련 도메인 설계 문서
   - 예: `docs/dev/daily-log/2026.03.12-domain-daily-log.md`
   - 예: `docs/dev/dashboard/2026.03.12-domain-dashboard.md`
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
   - 범용화 + 무료 가치 우선 로드맵: `docs/planning/2026.03.24-monetization-generalization-roadmap.md`
   - 수익화 전략: `docs/planning/2026.03.18-monetization-strategy.md`
   - 커밋 컨벤션 정리: `docs/planning/2026.04.09-commit-convention.md`
   - 성능 최적화 포인트: `docs/dev/performance/2026.03.17-optimization-points.md`
   - 성능 측정 기준선: `docs/dev/performance/2026.03.17-baseline.md`
   - 성능 측정 리포트: `docs/dev/performance/2026.03.17-measurement-report.md`
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
- `src/app/(protected)/scoreboards/page.tsx`
  - 점수판 보관함 화면
- `src/app/(protected)/scoreboards/_hooks/useScoreboardArchive.ts`
  - 점수판 보관함 상태 전환 로직
- `src/app/(protected)/dashboard/page.tsx`
  - 팀 대시보드, 실제 API 연동 완료
- `src/app/(protected)/setup/page.tsx`
  - 점수판/선행지표 설정 화면, 4DX 용어 코치마크 포함
- `src/app/(protected)/setup/_hooks/useScoreboardSetup.ts`
  - 점수판 설정 관련 로직
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
- 세션 쿠키 이름은 `wig_sid`
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

- `/api/push/subscribe`, `/api/push/send-daily`, `/api/push/send-weekly-focus` 라우트 존재
- 프로필 화면에서 PWA 푸시 구독 토글 제공
- 일일 기록 리마인드와 주간 집중 리마인드가 구현되어 있다
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

하네스 관련 파일이 바뀐 PR이면 위 점검에 더해 `wig-harness-security-check`도 수행한다.

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

API는 세션 쿠키 `wig_sid`를 사용한다.  
로컬에서 인증/조회가 이상하면 쿠키 전달, `mutator.ts`, Cloudflare D1 바인딩 경로를 먼저 확인하면 된다.
