# WIG Developer Onboarding

최종 확인일: 2026-04-03

이 문서는 WIG 저장소에 처음 들어온 개발자나 에이전트가 "무엇을 먼저 읽고, 어디를 고치고, 무엇을 조심해야 하는지"를 빠르게 파악하도록 만든 개발자용 시작 문서다. 기존 [`docs/onboarding.md`](/docs/onboarding.md)를 대체하지 않고, 현재 구현 기준으로 더 촘촘한 작업 안내를 보강한다.

## 1. 서비스와 현재 범위

WIG는 4DX 기반 목표 관리 서비스다. 핵심 흐름은 로그인 후 워크스페이스에 속하고, 활성 점수판을 만들고, 선행지표를 기록하면서 개인/팀 대시보드를 보는 구조다.

현재 구현 중심축은 아래 축들이다.

- 인증: 공개 회원가입, 로그인, 로그아웃, 비밀번호 변경, 복원코드 기반 계정 복구, 관리자용 사용자 생성
- 워크스페이스: 내 워크스페이스 조회, 생성, 초대코드 기반 참가, 초대코드 관리, 멤버 조회/퇴출
- 점수판: 활성 점수판 조회, 생성, 수정, 보관, 재활성화, 보관함 UI
- 선행지표: 생성, 수정, 삭제, 보관, 재활성화
- 일일 기록: 주간/월간 조회, 날짜별 기록 토글, 낙관적 업데이트
- 대시보드: 개인 뷰 기간 탐색, 팀 뷰, 주간/월간 달성률, 팀 메모 레일
- 프로필: 내 정보 조회, 닉네임 변경, 비밀번호 변경, 푸시 알림 토글
- 업데이트 허브: `/updates` 인앱 새 기능 모아보기
- export/analytics: `GET /api/analytics/export-data`와 CSV 다운로드
- 알림: 매일 밤 9시 리마인드, 매주 목요일 3시 집중 리마인드, PWA Web Push 구독

아직 미완성 또는 후속 범위로 보이는 항목도 분명하다.

- 무료 가치 측정용 이벤트 로그와 파일럿 지표 체계
- 별도 Analytics 대시보드 제품화
- 차트/시각화 고도화
- 탈퇴 API
- 워크스페이스 탈퇴/삭제와 관리자 권한 이전
- 팀 운영 고도화 기능
- 보조 Push API의 OpenAPI/공통 응답 규약 정리

## 2. 먼저 읽을 순서

저장소 규칙상 필요한 범위만 읽는 것이 원칙이다. 처음 진입할 때는 아래 순서를 권장한다.

1. [`README.md`](/README.md)
2. [`docs/onboarding.md`](/docs/onboarding.md)
3. 백엔드 첫 진입 시: [`docs/dev/backend/2026.03.18-backend-onboarding.md`](/docs/dev/backend/2026.03.18-backend-onboarding.md)
4. 작업 유형별 스킬
   - 문서/기획: [`.agents/skills/wig-planning/SKILL.md`](/.agents/skills/wig-planning/SKILL.md)
   - 프론트: [`.agents/skills/wig-frontend/SKILL.md`](/.agents/skills/wig-frontend/SKILL.md)
   - 백엔드: [`.agents/skills/wig-backend/SKILL.md`](/.agents/skills/wig-backend/SKILL.md)
   - 품질 점검: [`.agents/skills/wig-quality-check/SKILL.md`](/.agents/skills/wig-quality-check/SKILL.md)
   - 성능 점검: [`.agents/skills/wig-performance-check/SKILL.md`](/.agents/skills/wig-performance-check/SKILL.md)
   - 보안 점검: [`.agents/skills/wig-security-check/SKILL.md`](/.agents/skills/wig-security-check/SKILL.md)
   - 하네스 보안 점검: [`.agents/skills/wig-harness-security-check/SKILL.md`](/.agents/skills/wig-harness-security-check/SKILL.md)
   - 제품 업데이트: [`.agents/skills/wig-product-updates/SKILL.md`](/.agents/skills/wig-product-updates/SKILL.md)
5. 공통 설계 문서
   - [`docs/dev/common/2026.03.12-domain-overview.md`](/docs/dev/common/2026.03.12-domain-overview.md)
   - [`docs/dev/common/2026.03.12-api-conventions.md`](/docs/dev/common/2026.03.12-api-conventions.md)
   - [`docs/dev/common/2026.03.14-common-utilities.md`](/docs/dev/common/2026.03.14-common-utilities.md)
   - [`docs/dev/common/2026.03.12-security.md`](/docs/dev/common/2026.03.12-security.md)
   - [`docs/dev/common/2026.03.09-database-schema.md`](/docs/dev/common/2026.03.09-database-schema.md)
6. 작업 도메인 문서
7. 마지막으로 실제 구현 파일

문서와 코드가 다르면 코드가 우선이다.

## 3. 로컬 시작

### 필수 조건

- Node.js 18+
- Yarn 4.10.0
- Cloudflare D1 로컬 개발 환경

### 기본 명령

```bash
yarn install
yarn dev
```

유용한 보조 명령은 아래와 같다.

```bash
yarn gen:api
yarn test
yarn storybook
yarn mig:local
yarn preview
```

### 런타임/배포 관련 파일

- Wrangler: [`wrangler.jsonc`](/wrangler.jsonc)
- OpenNext Cloudflare: [`open-next.config.ts`](/open-next.config.ts)
- Drizzle 설정: [`drizzle.config.ts`](/drizzle.config.ts)
- Orval 설정: [`orval.config.ts`](/orval.config.ts)
- Vitest 설정: [`vitest.config.mts`](/vitest.config.mts)
- ESLint 설정: [`eslint.config.mjs`](/eslint.config.mjs)

### 환경에서 알아둘 점

- DB 바인딩 이름은 `DB`다.
- 세션 쿠키 이름은 `wig_sid`다.
- 푸시 알림은 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`가 필요하다.
- 배포 타깃은 Cloudflare Workers이며 OpenNext를 거친다.
- D1 마이그레이션은 `drizzle/` 디렉터리를 사용한다.

## 4. 폴더 구조 한눈에 보기

### 앱/화면

- [`src/app/page.tsx`](/src/app/page.tsx): 비로그인 랜딩 엔트리
- [`src/app/login/page.tsx`](/src/app/login/page.tsx): 로그인/회원가입 진입점
- [`src/app/account-recovery/page.tsx`](/src/app/account-recovery/page.tsx): 복원코드 기반 계정 복구
- [`src/app/(protected)/layout.tsx`](</src/app/(protected)/layout.tsx>): 보호 라우트 세션 체크
- [`src/app/(protected)/dashboard/my/page.tsx`](</src/app/(protected)/dashboard/my/page.tsx>): 개인 대시보드
- [`src/app/(protected)/dashboard/page.tsx`](</src/app/(protected)/dashboard/page.tsx>): 팀 대시보드
- [`src/app/(protected)/setup/page.tsx`](</src/app/(protected)/setup/page.tsx>): 점수판/선행지표 설정
- [`src/app/(protected)/scoreboards/page.tsx`](</src/app/(protected)/scoreboards/page.tsx>): 점수판 보관함
- [`src/app/(protected)/profile/page.tsx`](</src/app/(protected)/profile/page.tsx>): 프로필/알림/로그아웃
- [`src/app/(protected)/profile/avatar/page.tsx`](</src/app/(protected)/profile/avatar/page.tsx>): preset avatar 선택
- [`src/app/(protected)/profile/members/page.tsx`](</src/app/(protected)/profile/members/page.tsx>): 관리자용 멤버 관리
- [`src/app/(protected)/profile/export/page.tsx`](</src/app/(protected)/profile/export/page.tsx>): CSV 다운로드
- [`src/app/(protected)/updates/page.tsx`](</src/app/(protected)/updates/page.tsx>): 새 기능 모아보기
- [`src/app/(protected)/workspace/new/page.tsx`](</src/app/(protected)/workspace/new/page.tsx>): 워크스페이스 생성

### API 계약/생성 코드

- [`src/api-spec/openapi.yaml`](/src/api-spec/openapi.yaml): API 계약의 원본
- [`src/api/generated`](/src/api/generated): Orval 생성 결과물
- [`src/api/mutator.ts`](/src/api/mutator.ts): Axios 기반 요청 래퍼, `withCredentials: true`

### 서버 구현

- [`src/app/api`](/src/app/api): Next Route Handlers
- [`src/domain`](/src/domain): 도메인별 서비스/스토리지/검증
- [`src/lib/server/auth.ts`](/src/lib/server/auth.ts): 세션 조회
- [`src/lib/server/api-response.ts`](/src/lib/server/api-response.ts): 표준 응답
- [`src/lib/server/with-error-handler.ts`](/src/lib/server/with-error-handler.ts): 공통 에러 래퍼
- [`src/lib/server/errors.ts`](/src/lib/server/errors.ts): `PlatformError` 계층
- [`src/db/schema.ts`](/src/db/schema.ts): Drizzle 스키마
- [`src/db/index.ts`](/src/db/index.ts): `getDb`

### 공통 UI/클라이언트 기반

- [`src/app/layout.tsx`](/src/app/layout.tsx): QueryClient, ToastProvider, PWA 등록
- [`src/context/ToastContext.tsx`](/src/context/ToastContext.tsx): 전역 토스트
- [`src/components/ui`](/src/components/ui): 공통 UI 컴포넌트
- [`src/components/PushSubscriptionManager.tsx`](/src/components/PushSubscriptionManager.tsx): 푸시 구독 토글

## 5. 실제 아키텍처 흐름

백엔드는 비교적 단순한 계층 구조를 유지하고 있다.

1. `src/app/api/**/route.ts`에서 요청을 받는다.
2. Route Handler에서 Zod 검증을 수행한다.
3. 서비스는 `src/domain/<domain>/services/*.ts`에 둔다.
4. DB 접근은 `src/domain/<domain>/storage/*.ts`에 둔다.
5. 성공/실패 응답은 `apiSuccess`, `apiError`, `withErrorHandler` 패턴을 쓴다.

프론트는 OpenAPI 생성 훅 중심으로 돌아간다.

1. `src/api-spec/openapi.yaml` 수정
2. `yarn gen:api`
3. `src/api/generated/**` 훅 사용
4. 페이지 또는 `_hooks` 레이어에서 TanStack Query 상태와 UX를 조합

대표 예시는 아래 파일들이 잘 보여준다.

- 개인 대시보드 데이터 조합: [`src/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard.ts`](</src/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard.ts>)
- 팀 대시보드 집계: [`src/domain/dashboard/services/dashboard.service.ts`](/src/domain/dashboard/services/dashboard.service.ts)
- 로그인 처리: [`src/app/api/auth/login/route.ts`](/src/app/api/auth/login/route.ts), [`src/domain/auth/services/auth.service.ts`](/src/domain/auth/services/auth.service.ts)

## 6. 핵심 도메인별 구현 메모

### Auth

- 로그인 페이지는 로그인/회원가입을 함께 제공하고, 세션이 있으면 `/dashboard/my`로 리다이렉트한다.
- 보호 라우트는 서버에서 세션 없으면 `/`로 돌려보낸다.
- 세션은 D1 `sessions` 테이블과 `wig_sid` 쿠키를 함께 사용한다.
- 회원가입 직후 복원코드 8개를 1회 노출하고, 별도 계정 복구 페이지를 제공한다.

### Workspace

- 사용자는 워크스페이스가 없을 수 있다.
- 이 경우 개인 대시보드와 보관함은 CTA 화면으로 빠진다.
- 생성 화면은 `/workspace/new`에 있다.
- 참가 화면은 `/workspace/join`이며 초대코드를 대문자로 정규화해 전송한다.
- 관리자는 프로필 하위에서 워크스페이스 이름 수정과 멤버 관리를 수행한다.

### Scoreboard / Lead Measure

- 활성 점수판은 `user_id + workspace_id` 기준 하나만 허용된다.
- 점수판 생성/수정 화면은 `/setup` 하나로 통합돼 있다.
- 선행지표는 현재 주기 `WEEKLY`, `MONTHLY`를 중심으로 UI가 설계돼 있다.
- 보관함에서 활성 점수판 보관, 보관 점수판 재활성화가 가능하다.

### Daily Log / Dashboard

- 개인 대시보드는 `view`와 `date` 쿼리스트링을 사용해 주간/월간 탐색을 유지한다.
- 기록 토글은 낙관적 업데이트 후 실패 시 롤백한다.
- 지난주부터의 과거 기록은 수정할 수 없고 조회만 가능하다.
- 미래 날짜 기록은 서버 규칙상 금지다.
- 팀 대시보드는 같은 워크스페이스의 활성 점수판들을 읽기 모델로 집계한다.
- 팀 대시보드는 사용자별 메모 조회/생성/완료/삭제를 별도 메모 API로 붙인다.

### Profile / Push

- 프로필은 `GET/PUT /api/users/me`를 사용하며 `avatarKey`도 함께 다룬다.
- 비밀번호 변경은 Auth API를 재사용한다.
- 프로필 하위에는 avatar 선택, 멤버 관리, 초대코드 관리, CSV export 화면이 있다.
- 푸시 알림은 브라우저 지원, 서비스워커, VAPID 키가 모두 맞아야 동작한다.
- Push는 `send-daily`와 `send-weekly-focus` 내부 라우트를 함께 사용한다.

### Analytics / Updates

- 현재 analytics는 별도 대시보드 제품이 아니라 export API 중심으로 구현돼 있다.
- `/updates`는 `src/content/product-updates.ts`를 원본으로 쓰는 인앱 업데이트 허브다.

## 7. 현재 API 표면

현재 `src/app/api`와 `openapi.yaml` 기준으로 주요 엔드포인트는 아래 수준까지 구현돼 있다.

- Auth: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/password`, `/api/auth/recovery-codes/verify`, `/api/auth/password/by-recovery-code`
- Admin: `/api/admin/users`
- Workspace: `/api/workspaces`, `/api/workspaces/me`, `/api/workspaces/:id`, `/api/workspaces/join`, `/api/workspaces/join-by-invite`, `/api/workspaces/:id/invites`, `/api/workspaces/:id/invites/:inviteId/status`, `/api/workspaces/:id/members`, `/api/workspaces/:id/members/:memberId`
- Scoreboard: `/api/scoreboards`, `/api/scoreboards/active`, `/api/scoreboards/:id`, `/api/scoreboards/:id/archive`, `/api/scoreboards/:id/reactivate`
- Lead Measure: `/api/scoreboards/:id/lead-measures`, `/api/lead-measures/:id`, `/api/lead-measures/:id/archive`, `/api/lead-measures/:id/reactivate`
- Daily Log: `/api/lead-measures/:id/logs/:date`, `/api/scoreboards/:id/logs/weekly`, `/api/scoreboards/:id/logs/monthly`
- Dashboard: `/api/dashboard/team`, `/api/dashboard/team/memos`, `/api/dashboard/team/memos/:memoId/resolve`, `/api/dashboard/team/memos/:memoId`
- Profile: `/api/users/me`
- Analytics: `/api/analytics/export-data`
- Push: `/api/push/subscribe`, `/api/push/send-daily`, `/api/push/send-weekly-focus`
- OpenAPI: `/api/openapi`

주의할 점도 있다.

- My View는 별도 `/api/dashboard/me` 집계 엔드포인트가 아니라 활성 점수판 조회와 주간/월간 로그 조회 조합으로 구성된다.
- 계약을 바꾸면 반드시 `src/api-spec/openapi.yaml`부터 수정해야 한다.

## 8. 데이터 모델 핵심

Drizzle 스키마 기준 핵심 테이블은 아래와 같다.

- `users`
- `sessions`
- `push_subscriptions`
- `workspaces`
- `workspace_members`
- `scoreboards`
- `lead_measures`
- `daily_logs`

특히 기억할 제약은 아래다.

- 활성 점수판 유니크 인덱스 존재
- `daily_logs`는 `(lead_measure_id, log_date)` 유니크
- 대부분 관계는 `ON DELETE CASCADE`
- 날짜는 문자열과 timestamp 정수를 혼용하므로, 클라이언트/서버 날짜 계산을 함부로 바꾸면 안 된다

## 9. 작업 규칙

- Yarn만 사용
- API 계약 변경 시 `openapi.yaml` 먼저 수정
- 백엔드는 Zod 검증 사용
- Route Handler는 `withErrorHandler` 패턴 유지
- 직접 `NextResponse.json`을 늘리기보다 `apiSuccess`, `apiError` 우선
- 기존 도메인 구조 재사용 후 필요한 경우만 확장
- 사용자 변경이 섞인 워크트리일 수 있으니, 내 작업과 무관한 수정은 건드리지 않기

## 10. 품질 상태와 검증 팁

2026-03-19에 실제로 확인한 기준이다.

- `yarn tsc --noEmit`: 통과
- `yarn lint`: 통과
- `yarn test --run`: 통과
- `yarn test:storybook --run`: 별도 브라우저/Storybook 테스트 경로

그래서 작업 시에는 "관련 범위만 최소 검증 후 필요 시 전역 게이트 확장" 원칙이 적절하다.

- 타입 영향이 크면 `yarn tsc --noEmit`
- API 계약 바뀌면 `yarn gen:api`
- 도메인 로직 바뀌면 해당 `vitest` 테스트
- 프론트 단일 파일 수정은 필요한 경우 `yarn eslint <file>`
- Storybook browser 테스트가 필요한 UI 변경이면 `yarn test:storybook --run`

## 11. 처음 작업할 때 추천 동선

### 프론트 작업

1. 해당 페이지와 `_hooks` 확인
2. 사용하는 generated hook 확인
3. 관련 OpenAPI 스키마 확인
4. 도메인 문서와 실제 API 응답 구조 대조

### 백엔드 작업

1. `openapi.yaml` 확인 또는 수정
2. 해당 Route Handler 확인
3. `service -> storage -> validation` 순서로 읽기
4. 기존 테스트 패턴 복제 후 변경

### 문서 작업

1. `docs/onboarding.md`와 관련 `docs/dev/**` 확인
2. 현재 코드와 어긋나는 부분 체크
3. 문서가 구현을 따라가도록 갱신

## 12. 빠르게 찾는 파일 목록

- 로그인 시작점: [`src/app/_components/LoginPageClient.tsx`](/src/app/_components/LoginPageClient.tsx)
- 개인 대시보드 상태: [`src/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard.ts`](</src/app/(protected)/dashboard/my/_hooks/useDashboardScoreboard.ts>)
- 팀 대시보드 상태: [`src/app/(protected)/dashboard/_hooks/useTeamDashboard.ts`](</src/app/(protected)/dashboard/_hooks/useTeamDashboard.ts>)
- 점수판 설정 상태: [`src/app/(protected)/setup/_hooks/useScoreboardSetup.ts`](</src/app/(protected)/setup/_hooks/useScoreboardSetup.ts>)
- 점수판 보관함 상태: [`src/app/(protected)/scoreboards/_hooks/useScoreboardArchive.ts`](</src/app/(protected)/scoreboards/_hooks/useScoreboardArchive.ts>)
- 서버 응답 규격: [`src/lib/server/api-response.ts`](/src/lib/server/api-response.ts)
- 에러 처리: [`src/lib/server/with-error-handler.ts`](/src/lib/server/with-error-handler.ts)
- DB 스키마: [`src/db/schema.ts`](/src/db/schema.ts)
- API 계약: [`src/api-spec/openapi.yaml`](/src/api-spec/openapi.yaml)

## 13. 현재 문서화에서 보인 차이점

- 기존 문서 일부는 계획 상태를 아직 포함하고 있어 실제 구현보다 넓거나 다를 수 있다.
- 특히 Dashboard는 문서상 별도 `/api/dashboard/me`가 보이지만, 현재 개인 뷰는 활성 점수판과 로그 API 조합으로 동작한다.
- Storybook browser 테스트는 기본 `yarn test`에 포함되지 않는다. 브라우저 기반 검증이 필요하면 별도 명령으로 실행한다.

이 문서로 시작한 뒤, 실제 변경은 항상 현재 코드와 테스트를 기준으로 판단하면 된다.
