# Dowin

Dowin은 개인/팀의 목표 실행과 주간 운영을 관리하는 서비스입니다.

## 핵심 기능

- 인증 및 세션 기반 로그인 (`dowin_sid` 쿠키)
- 워크스페이스 생성/참가, 초대 링크, 멤버 관리
- 핵심 목표 점수판 생성, 보관, 재활성화
- 액션 아이템 생성/관리
- 일일 O/X 기록 및 주간/월간 달성률 집계
- 팀 체크인 생성, 응답, 인박스 조회 및 주간 리포트
- 체크인 기반 조정 제안(Adjustment Proposal) 생성 및 승인
- 내 대시보드 / 팀 대시보드 조회
- 구독 및 결제 (Polar 연동)
- 푸시 알림 토글 및 개인 리마인드 시간 설정

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

`.env.example`를 기준으로 로컬용 `.env.local`과 `.dev.vars`를 작성하면 됩니다.

둘을 나누는 이유는 값을 읽는 실행 환경이 다르기 때문입니다.

- `.env.local`
  - Next.js 앱이 읽습니다.
  - 브라우저에서 쓰는 `NEXT_PUBLIC_*` 값이 여기서 주입됩니다.
- `.dev.vars`
  - `wrangler dev`로 실행되는 Worker 런타임이 읽습니다.
  - API 라우트에서 `env.*`로 접근하는 값이 여기서 주입됩니다.

`.dev.vars`의 구성은 `.env.example`과 동일합니다. `.env.example`을 복사해서 `.dev.vars`로 저장한 뒤 실제 값으로 채우면 됩니다.

> **Tip**: FCM, Polar, Discord Webhook 등 외부 연동에 필요한 실제 시크릿 키 값들은 **팀 내부에서 따로 공유받아** 채워주세요.

> **Polar 샌드박스 로컬 테스트 시 주의**: Polar 웹훅은 public URL로 전송되므로 `localhost`에서는 수신할 수 없습니다.
> Cloudflare Tunnel(`cloudflared tunnel`)로 로컬 서버를 외부에 노출한 뒤, 해당 URL을 `APP_BASE_URL`에 설정하세요.

### 4) 로컬 DB 마이그레이션

```bash
yarn mig:local
```

> **Tip: 로컬 DB 초기화가 필요할 때**
> 개발 중 로컬 데이터가 꼬여서 데이터베이스를 완전히 초기화하고 싶다면, `.wrangler/state` 폴더를 삭제한 뒤 `yarn mig:local`을 다시 실행하세요.

### 5) 개발 서버 실행

```bash
yarn dev
```

- 앱: `http://localhost:4000`
- 스웨거: `http://localhost:4000/api-docs`
- Storybook: `yarn storybook` 실행 후 `http://localhost:6006`

> **첫 로그인 (계정 생성) 안내**: 마이그레이션 직후 DB는 비어 있습니다. 브라우저에서 `http://localhost:4000/login` 화면으로 진입하여 **직접 회원가입을 통해 테스트 계정을 생성**하고 시작하시면 됩니다.

## 주요 명령어

```bash
yarn dev               # 개발 서버
yarn build             # 프로덕션 빌드
yarn start             # 빌드 결과 실행
yarn test --run        # 전체 Vitest 1회 실행
yarn test:frontend     # 프론트엔드 테스트 묶음
yarn test:backend      # 백엔드/API/domain 테스트 묶음
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

## 배포 및 체인지로그 (Release Please)

- 커밋 메시지 규칙(`feat:`, `fix:` 등)을 지켜서 `main`에 머지하면, **Release Please Action이 버전 넘버링과 `CHANGELOG.md`를 자동 관리**하는 PR을 띄워줍니다. 수동으로 체인지로그를 적을 필요가 없습니다.
- Cloudflare Workers Builds(Git integration)는 `production` 브랜치만 자동 빌드/배포합니다.
- `main` 브랜치는 개발 통합 브랜치입니다.
- 실제 배포는 `main -> production` PR 머지로만 진행합니다.
- **배포 PR 제목은 `release: YYYY-MM-DD vX.Y.Z` 형식으로 작성합니다.**
- `production` PR은 `PR CI`와 `Production DB Migration Check`를 통과해야 머지합니다.
- `production` 브랜치에는 직접 push하지 않고 PR로만 머지합니다.
- `production` PR이 merge되면 `Production DB Migration` 워크플로가 자동으로 production DB migration을 적용합니다.
- 자세한 배포 운영 방식은 [Production Deployment Flow](/docs/dev/common/2026.04.19-production-deployment-flow.md)를 참고합니다.

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
- 제품 포지셔닝/문서 기준: `docs/dev/common/2026.05.09-product-positioning-and-writing-rules.md`
- 도메인 개요: `docs/dev/common/2026.03.12-domain-overview.md`
- 스킬: `.agents/skills/frontend/SKILL.md`, `.agents/skills/backend/SKILL.md`, `.agents/skills/planning/SKILL.md`, `.agents/skills/quality-check/SKILL.md`, `.agents/skills/security-check/SKILL.md`, `.agents/skills/harness-security-check/SKILL.md`, `.agents/skills/product-updates/SKILL.md`
