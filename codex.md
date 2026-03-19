# Codex 운영 계획 for WIG

## 1. 목적

이 문서는 WIG 저장소에서 Codex를 사용할 때의 작업 기준, 명령 규칙, 검증 루틴, 문서 우선순위를 고정하기 위한 운영 계획이다.  
Claude Code에 익숙한 흐름을 최대한 유지하되, 이 저장소의 실제 구현 상태와 Codex의 작업 습관에 맞게 표준화한다.

> 참고: 요청에 적힌 `.agnets/workflows` 경로는 실제로는 `.agents/workflows`이다.

---

## 2. 문서 우선순위

Codex는 아래 순서로 사실상 Source of Truth를 판단한다.

1. 실제 구현 코드
   - `src/app/api`
   - `src/domain`
   - `src/lib`
   - `src/db`
   - `src/api-spec/openapi.yaml`
   - `package.json`
2. 공통 규약 문서
   - `docs/dev/common/*`
   - `docs/onboarding.md`
3. 최신 구현 결과 문서
   - `docs/dev/auth/2026.03.14-*`
   - `docs/dev/workspace/2026.03.14-*`
4. 도메인 설계 문서
   - `docs/dev/**/2026.03.12-domain-*.md`
5. 상위 기획/브랜딩/프로토타입 문서
   - `docs/planning/*`
   - `docs/prototype/*`
   - `docs/design/*`

규칙:

- 구현과 문서가 충돌하면 Codex는 먼저 구현 코드를 확인한다.
- 공통 규약과 도메인 문서가 충돌하면 `docs/dev/common/*`를 우선한다.
- 기획 문서는 의도와 방향 확인용으로 쓰고, API/보안/응답 규격의 최종 근거로 쓰지 않는다.

현재 확인된 대표 충돌:

- Auth 관련 문서는 세션 쿠키 기준으로 통일한다. 실제 구현과 공통 유틸은 `wig_sid` 기반 세션 쿠키 방식을 사용한다.
- 이 충돌은 추후 문서 정리 작업 대상으로 관리한다.

---

## 3. Codex 작업 원칙

### 3.1. 시작 루틴

모든 작업은 아래 순서로 시작한다.

1. 관련 문서와 구현 파일을 먼저 읽는다.
2. 이미 존재하는 패턴을 재사용한다.
3. 변경 범위를 최소화한다.
4. 코드 수정 후 타입, 테스트, 린트까지 가능한 범위에서 검증한다.

### 3.2. 작업 유형별 필수 워크플로우

#### 기획/설계

- `.agents/workflows/planning.md`를 따른다.
- 새 문서를 파편적으로 늘리지 않고, 가능하면 기존 핵심 문서를 갱신한다.
- 문서 상단 frontmatter를 유지한다.
- 기획 완료 전 개발로 성급히 넘어가지 않는다.

#### 프론트엔드

- `.agents/workflows/frontend.md`를 따른다.
- `src/components/ui` 공통 컴포넌트를 우선 사용한다.
- `Button` 안에 `Link`를 넣을 때는 `asChild`를 사용한다.
- React 19 기준으로 `forwardRef`를 새로 도입하지 않는다.
- 폼 검증은 Zod를 쓴다.
- 서버 변경이 있으면 Orval 훅과 TanStack Query 무효화까지 맞춘다.
- 공통 UI 변경 시 Storybook 문서 추가/갱신 여부를 함께 판단한다.

#### 백엔드

- `.agents/workflows/backend-tdd.md`를 따른다.
- 기본 순서는 Red -> Green -> Refactor다.
- Route Handler는 실제 구현 파일인 `src/lib/with-error-handler.ts` 패턴을 사용한다.
- 입력 검증은 Zod로 처리한다.
- 응답은 `apiSuccess`, `apiError` 규격을 따른다.
- 인증이 필요한 API는 `getSession`을 사용한다.
- DB 접근은 `src/domain/*/storage`에 두고, Drizzle/Prepared Statement 원칙을 지킨다.
- Cloudflare 바인딩 접근이 필요하면 현재 구현 패턴을 우선 확인하고 따른다.

---

## 4. 환경 구성 계획

### Phase 1. 로컬 실행 기준 고정

목표: Codex가 항상 같은 방식으로 프로젝트를 읽고 검증하도록 기준을 고정한다.

실행 기준:

```bash
yarn install
yarn dev
yarn storybook
yarn test
yarn lint
yarn tsc --noEmit
```

추가 기준:

- 패키지 매니저는 `yarn@4.10.0`만 사용한다.
- 개발 서버는 `yarn dev`
- UI 확인은 `yarn storybook`
- API 타입 생성은 `yarn gen:api`
- D1 스키마 반영은 `yarn mig:local`, 원격은 `yarn mig:remote`

### Phase 2. Codex 명령 규칙 고정

Codex에게 이 저장소에서 기대하는 기본 행동:

- 파일 탐색은 `rg`, `rg --files`를 우선 사용
- 수정 전 관련 파일을 먼저 읽기
- 기존 패턴이 있으면 새 구조를 만들기보다 재사용
- 수정은 작은 단위로 수행
- 가능하면 작업 끝에 검증 명령까지 실행
- 작업 도중 문서 불일치가 보이면 코드 기준으로 판단하고, 필요 시 문서 정리 TODO를 남김

### Phase 3. 문서/코드 동기화 루틴 추가

아래 변경이 있으면 Codex가 문서 갱신을 같이 판단하도록 한다.

- 아키텍처 변경: `docs/onboarding.md`, 관련 `docs/dev/common/*`
- 도메인 API 추가/변경: `src/api-spec/openapi.yaml`, 관련 도메인 문서
- 공통 유틸 변경: `docs/dev/common/2026.03.14-common-utilities.md`
- 새 개발 표준 도입: `.agents/workflows/*` 또는 `docs/onboarding.md`

### Phase 4. 문서 충돌 정리 백로그 생성

우선순위 높은 문서 정리 항목:

1. 인증 문서의 세션 모델 표현 일관성 점검
2. `Next.js 15+`와 `README`의 `Next.js 16` 표현 통일
3. 실제 구현된 도메인과 아직 설계만 있는 도메인 상태 구분 강화
4. `docs/dev/common/*`의 실제 파일명/경로 참조 정확도 점검

---

## 5. 표준 작업 플레이북

### 5.1. API 변경 작업

순서:

1. 관련 도메인 문서와 `docs/dev/common/*` 확인
2. `src/api-spec/openapi.yaml` 먼저 수정
3. 필요 시 `yarn gen:api`
4. Route -> Service -> Storage 순으로 구현
5. Zod 검증, 표준 응답, 인증/인가 반영
6. 테스트 작성 및 실행
7. 프론트엔드 훅/연동부 업데이트

### 5.2. DB 스키마 변경 작업

순서:

1. `docs/dev/common/2026.03.09-database-schema.md`와 현재 `src/db` 구현 비교
2. `src/db/schema.ts` 수정
3. migration 생성/적용
4. 관련 Storage/Service/API 수정
5. 테스트와 타입 검증 실행

### 5.3. 프론트 화면 작업

순서:

1. 해당 도메인의 설계 문서 확인
2. 기존 `src/app/.../_components` 및 `src/components/ui` 패턴 재사용
3. Orval 훅, Query invalidation, 로딩/에러/토스트 상태 반영
4. 모바일 화면 기준 확인
5. 공통 컴포넌트 영향이 있으면 Storybook까지 갱신

---

## 6. 검증 체크리스트

Codex는 작업 종류에 따라 아래를 가능한 한 기본 검증 세트로 사용한다.

공통:

- `yarn tsc --noEmit`
- `yarn lint`

백엔드:

- `yarn test`
- 변경한 도메인 테스트 우선 실행
- 인증/인가, 소유권, 미래 날짜 금지, 상태 전이 같은 비즈니스 규칙 확인

프론트엔드:

- `yarn tsc --noEmit`
- `yarn lint`
- 필요한 경우 `yarn storybook`
- 모바일 레이아웃, 빈 상태, 로딩 상태, 실패 롤백 확인

API 스펙 변경:

- `yarn gen:api`
- 생성 코드와 사용처 타입 오류 확인

DB 변경:

- migration 생성/적용 가능 여부 확인
- 스키마와 Storage 레이어 정합성 확인

---

## 7. Codex에게 요청하는 방식

Claude Code처럼 포괄적으로 요청해도 되지만, Codex에는 아래 형식이 가장 안정적이다.

### 좋은 요청 예시

- "`docs/dev/auth`와 실제 구현을 비교해서 불일치 정리하고 바로 수정해줘. 수정 후 테스트까지 돌려줘."
- "`src/app/dashboard/my`의 mock 데이터를 실제 API로 교체해줘. 관련 Orval 훅과 쿼리 무효화까지 포함해."
- "`workspace` 도메인에 멤버 강제 퇴출 API를 추가해줘. backend-tdd 워크플로우에 맞춰 테스트 먼저 작성해."

### 같이 주면 좋은 정보

- 변경 대상 경로
- 기대 동작
- UI인지 API인지
- 테스트 포함 여부
- 문서도 같이 갱신할지 여부

### Codex에게 기본적으로 기대할 수 있는 것

- 먼저 코드와 문서를 읽고 시작
- 가능한 범위에서 직접 수정
- 검증까지 수행
- 충돌 문서가 있으면 작업 중 명시

### 어떤 요청이 어떤 스킬을 타는가

- `wig-backend`
  - API 추가, 인증/세션 수정, 서비스/스토리지 수정, 백엔드 버그 수정
- `wig-frontend`
  - 페이지 UI 변경, Orval 연동, Query invalidation, 공통 UI/Storybook 작업
- `wig-planning`
  - 기획 문서 작성, 범위 조정, 온보딩 문서 정리, 구현 전 액션 아이템 정리
- `wig-quality-check`
  - 테스트 실행, 품질 게이트 점검, 회귀 위험 검토, 배포 전 검증

---

## 8. 팀 운영 제안

Codex를 이 저장소에서 안정적으로 쓰려면 아래 3가지를 팀 규칙으로 고정하는 것이 좋다.

1. API 변경은 반드시 `openapi.yaml`부터 시작
2. 백엔드 변경은 반드시 도메인 문서와 테스트를 같이 본다
3. 큰 변경 후에는 `docs/onboarding.md`를 최신화한다

이 세 가지만 지켜도 Codex의 작업 일관성과 재현성이 크게 올라간다.
