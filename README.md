# WIG (Wildly Important Goals)

WIG는 4DX(실행의 4가지 원칙)를 기반으로 개인/팀의 목표 실행을 관리하는 서비스입니다.
기록을 쌓는 데서 끝나지 않고, 이번 주 승패(Win/Loss)를 점수판으로 명확하게 보여주도록 설계했습니다.

## 핵심 기능

- 인증 및 세션 기반 로그인 (`wig_sid` 쿠키)
- 워크스페이스 생성/참가, 이름 변경, 멤버 관리
- WIG(가중목) 점수판 생성, 보관, 재활성화
- 선행지표(Lead Measure) 생성/관리
- 일일 O/X 기록 및 주간/월간 달성률 집계
- 내 대시보드 / 팀 대시보드 조회
- 프로필 조회/수정, preset avatar 선택, 푸시 알림 토글
- 선행지표 CSV export

## 기술 스택

- Next.js 16 (App Router), React 19
- Tailwind CSS 4
- Cloudflare D1 + Drizzle ORM
- OpenAPI + Orval (API 타입/훅 생성)
- TanStack Query v5
- Zod
- Vitest, Storybook
- OpenNext + Cloudflare Workers
- Yarn 4.10.0

## 프로젝트 구조

```text
.
├─ src/
│  ├─ app/                    # Next.js App Router (페이지 + API 라우트)
│  ├─ domain/                 # 도메인별 service / storage / validation
│  ├─ db/                     # Drizzle schema, DB 진입점
│  ├─ api-spec/               # OpenAPI 명세 (single source of truth)
│  └─ api/generated/          # Orval 생성 코드
├─ docs/
│  ├─ onboarding.md           # 저장소 온보딩 시작점
│  └─ dev/                    # 도메인/공통 설계 및 구현 문서
├─ drizzle/                   # D1 마이그레이션 파일
├─ wrangler.jsonc             # Cloudflare Worker/D1 설정
└─ package.json
```

## 빠른 시작

### 1) 사전 준비

- Node.js 18+
- Yarn 4 (`corepack enable` 권장)
- Cloudflare 계정 (배포 또는 D1 원격 작업 시)

### 2) 설치

```bash
yarn install
```

### 3) 환경 변수 설정

로컬 실행 전 환경 변수를 준비하세요.

- 필수/주요 키
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `CRON_SECRET`

`.env.example`를 기준으로 로컬용 `.env.local`과 `.dev.vars`를 작성하면 됩니다.

둘을 나누는 이유는 값을 읽는 실행 환경이 다르기 때문입니다.

- `.env.local`
  - Next.js 앱이 읽습니다.
  - 브라우저에서 쓰는 `NEXT_PUBLIC_*` 값이 여기서 주입됩니다.
- `.dev.vars`
  - `wrangler dev`로 실행되는 Worker 런타임이 읽습니다.
  - API 라우트에서 `env.*`로 접근하는 값이 여기서 주입됩니다.

현재 WIG에서는 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`가 클라이언트와 서버 양쪽에서 모두 필요하므로 두 파일에 모두 넣습니다.

- `.env.local`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `.dev.vars`
  - `NEXTJS_ENV`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `CRON_SECRET`

### 4) 로컬 DB 마이그레이션

```bash
yarn mig:local
```

### 5) 개발 서버 실행

```bash
yarn dev
```

- 앱: `http://localhost:3000`
- 스웨거: `http://localhost:3000/api-docs`
- Storybook: `yarn storybook` 실행 후 `http://localhost:6006`

## 주요 명령어

```bash
yarn dev               # 개발 서버
yarn build             # 프로덕션 빌드
yarn start             # 빌드 결과 실행
yarn test              # Vitest
yarn gen:api           # OpenAPI 기반 Orval 생성
yarn mig:local         # 로컬 D1 마이그레이션 적용
yarn mig:remote        # 원격 D1 마이그레이션 적용
yarn storybook         # Storybook 실행
yarn deploy            # Cloudflare 배포
```

## API 계약 변경 규칙

백엔드 API 계약을 바꿀 때는 아래 순서를 따릅니다.

1. `src/api-spec/openapi.yaml` 수정
2. `yarn gen:api` 실행
3. 라우트/도메인 코드 반영

## 배포

`main` 브랜치에 push되면 Cloudflare Workers Builds(Git integration)에서 자동으로 빌드/배포됩니다.

수동 배포가 필요할 때는 아래 명령어를 사용합니다.

```bash
yarn deploy
```

시크릿은 Wrangler로 등록합니다.

```bash
yarn wrangler secret put <KEY_NAME>
```

## 문서 시작점

- 온보딩: `docs/onboarding.md`
- 개발자 시작 문서: `docs/dev/README.md`
- 도메인 개요: `docs/dev/common/2026.03.12-domain-overview.md`
- 스킬: `.agents/skills/wig-frontend/SKILL.md`, `.agents/skills/wig-backend/SKILL.md`, `.agents/skills/wig-planning/SKILL.md`, `.agents/skills/wig-quality-check/SKILL.md`, `.agents/skills/wig-security-check/SKILL.md`, `.agents/skills/wig-harness-security-check/SKILL.md`, `.agents/skills/wig-product-updates/SKILL.md`
