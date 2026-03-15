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

## 2. 현재 상태 요약 (2026-03-16 기준)

### 2.1. 구현 완료

- Auth 핵심 백엔드와 프론트 연동 완료
- Workspace 핵심 백엔드와 일부 프론트 연동 완료
- Scoreboard / Lead Measure / Daily Log 백엔드 핵심 API 구현 완료
- 점수판 보관함 UI 및 점수판 재활성화 흐름 구현 완료
- `dashboard/my`는 실제 API와 연동 완료
- `dashboard` 팀 뷰는 실제 API와 연동 완료
- `dashboard/my` 주간 점수판에서 `미기록 <-> O` 토글 가능
- Daily Log는 낙관적 업데이트 + 실패 롤백 적용 완료
- `dashboard/my` 상단 주간/월간 달성률 노출 완료
- 팀 대시보드 멤버 카드에 주간/월간 달성률 노출 완료
- Profile `GET /api/users/me`, `PUT /api/users/me` 구현 완료
- 닉네임 변경 시 DB 저장 및 프로필 재조회 완료
- 선행지표 상세 화면 제거 완료
- API 라우트 dynamic slug는 `id` 기준으로 정리 완료
- `getSession(db)`는 실제 Drizzle DB 타입 기준으로 동작하도록 정리 완료
- 대시보드 주간 날짜 계산은 클라이언트 KST 기준으로 보정 완료

### 2.2. 아직 남은 것

- 대시보드 차트/시각화 고도화 미완료
- Confetti 축하 인터랙션 미연결
- 프로필 탈퇴 API 미구현
- `dashboard/my` 헤더 닉네임은 아직 `localStorage.wig_user` fallback 사용

### 2.3. 현재 깨져 있는 것

- `yarn tsc --noEmit`는 저장소 전역 기준 아직 실패한다
  - 원인은 이번 작업과 무관한 기존 백엔드/생성 코드 타입 오류가 남아 있기 때문
- `yarn lint` 스크립트는 현재 `next lint` 설정 문제로 그대로는 동작하지 않는다
  - 변경 파일 검증은 `yarn eslint <files>`로 우회 중

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
2. 작업 유형별 워크플로우
   - 프론트엔드: `.agents/workflows/frontend.md`
   - 백엔드: `.agents/workflows/backend-tdd.md`
   - 기획/문서: `.agents/workflows/planning.md`
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
6. 마지막으로 실제 구현 파일

원칙은 단순하다.  
문서가 코드와 다르면 현재 구현 파일을 우선 확인하고, 문서를 그에 맞춰 갱신한다.

## 5. 저장소 구조와 어디를 보면 되는지

### 5.1. 프론트엔드

- `src/app/page.tsx`
  - 로그인 페이지
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
  - 점수판/선행지표 설정 화면
- `src/app/(protected)/setup/_hooks/useScoreboardSetup.ts`
  - 점수판 설정 관련 로직
- `src/app/(protected)/profile/page.tsx`
  - 프로필 및 비밀번호 변경
- `src/app/api/users/me/route.ts`
  - 내 프로필 조회 / 닉네임 변경 API
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

- 로그인, 로그아웃, 비밀번호 변경 동작
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
- 멤버 조회 API 구현
- 대시보드에서 워크스페이스 없음 상태 처리 완료

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
- 상세 화면은 실제 데이터 연동 완료, 장기 히스토리/편집 UX는 후속 범위

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
- 주간/월간 달성률 동시 노출 완료
- 차트/시각화는 미완성

관련 문서:

- `docs/dev/dashboard/2026.03.12-domain-dashboard.md`
- `docs/dev/dashboard/2026.03.15-frontend.md`

### 6.7. Profile

- 내 프로필 조회 API 구현
- 닉네임 변경 API 구현
- 프로필 화면은 실제 `me` API 연동 완료
- 비밀번호 변경은 Auth API 사용
- 탈퇴는 아직 서버 삭제 API 없이 로그아웃 흐름만 연결되어 있다

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
- `src/app/dashboard/my/_lib/week.ts`
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

전체 품질 게이트가 아직 깨져 있으므로, 작업 범위에 맞는 최소 검증부터 한다.

프론트 변경 예시:

```bash
yarn eslint <changed-files>
```

백엔드 변경 예시:

```bash
yarn test --run <changed-test-file>
```

주의:

- `yarn tsc --noEmit`는 현재 전역 오류로 실패할 수 있다
- `yarn lint`는 현재 스크립트 상태상 그대로는 신뢰하지 않는다

## 10. 현재 작업 시작 포인트 추천

작업 유형별로 보통 여기서 시작하면 된다.

- 로그인/세션 문제: `src/lib/server/auth.ts`, `src/app/api/auth/*`, `src/app/_components/LoginPageClient.tsx`
- 워크스페이스 상태 문제: `src/app/api/workspaces/*`, `src/app/dashboard/my/page.tsx`
- Daily Log 기록 문제: `src/app/dashboard/my/_hooks/useDashboardScoreboard.ts`, `src/app/api/lead-measures/[id]/logs/[date]/route.ts`, `src/domain/daily-log/*`
- 점수판/선행지표 문제: `src/app/setup/*`, `src/app/api/scoreboards/*`, `src/app/api/lead-measures/*`
- 대시보드 mock 제거: `src/app/dashboard/page.tsx`

## 11. 현재 가장 현실적인 다음 작업

우선순위는 아래 순서가 적절하다.

1. `dashboard` 팀 뷰 mock 제거
2. 사용자 `me` 조회/수정 API 정리 후 닉네임 임시 처리 제거
3. 전역 TypeScript 오류 정리
4. `yarn lint` 스크립트 정상화
5. 대시보드 시각화와 confetti 인터랙션 추가

## 12. 마지막으로 기억할 것

- 이 저장소는 문서가 비교적 잘 갖춰져 있지만, 일부 구현 속도가 문서보다 앞서 있다
- 작업 전에는 도메인 문서와 현재 코드를 둘 다 확인해야 한다
- 프론트는 아직 mock과 실제 API가 혼재되어 있다
- 백엔드는 layered 구조가 잡혀 있으니, 새 로직도 같은 패턴으로 넣어야 한다
- 지금 가장 중요한 안정화 포인트는 mock 제거, 타입 오류 정리, 검증 체계 복구다

---

API는 세션 쿠키 `wig_sid`를 사용한다.  
로컬에서 인증/조회가 이상하면 쿠키 전달, `mutator.ts`, Cloudflare D1 바인딩 경로를 먼저 확인하면 된다.
