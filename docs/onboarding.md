# WIG 프로젝트 온보딩 가이드 (AI Agent & Developer용)

이 문서는 새로운 개발자나 AI Agent가 WIG 프로젝트의 최신 기술 스택, 아키텍처, 그리고 개발 표준을 빠르게 파악하고 즉시 기여할 수 있도록 돕기 위해 작성되었습니다.

## 1. 프로젝트 개요 및 비전

- **서비스 명**: WIG (Wildly Important Goal)
- **핵심 컨셉**: 4DX(실행의 4가지 원칙) 방법론을 기반으로 한 목표 관리 및 동기부여 서비스.
- **디자인 철학**: Notion 스타일의 미니멀리즘, Linear풍의 세련된 UI (Glassmorphism, 고품질 그라디언트).
- **대상**: 개인의 실행력 강화 및 소규모 목표 달성 그룹.

## 2. 기술 스택 (The WIG Stack)

프로젝트는 최신 라이브러리와 엄격한 타입을 기반으로 합니다.

- **Framework**: Next.js 15+ (App Router)
- **Library**: **React 19** (직접 `ref` 전달 등 최신 기능 적극 활용)
- **Styling**: **Tailwind CSS 4** (CSS 변수 기반 테마 시스템)
- **API Reference**: OpenAPI (Swagger)
- **API Client**: **Orval** + **TanStack Query v5** (자동 생성 및 서버 상태 관리)
- **Validation**: **Zod** (런타임 타입 체크 및 폼 검증)
- **Database**: Cloudflare D1 (SQLite 기반 리모트 DB) + Drizzle ORM
- **UI Documentation**: **Storybook 8+** (컴포넌트 독립 개발 및 시각적 테스트)

## 3. 핵심 아키텍처 및 디렉토리 구조

관심사 분리와 도메인 중심 설계를 따릅니다.

### 3.1. 디렉토리 구조
```text
src/
├── app/                  # Next.js App Router (페이지 및 도메인 단위 폴더)
│   ├── dashboard/
│   │   ├── _components/  # 해당 도메인 전용 UI 컴포넌트
│   │   ├── _hooks/       # 해당 도메인 전용 비즈니스 로직
│   │   └── page.tsx
├── components/
│   └── ui/               # 전역 공통 UI 컴포넌트 (Button, Input 등)
│       └── stories/      # 컴포넌트별 스토리북 파일
├── hooks/                # 전역 공통 Hooks
├── context/              # 전역 Context Providers
├── api/
│   ├── generated/        # Orval로 자동 생성된 API Hooks
│   └── mutator.ts        # Axios 커스텀 설정 (인증 등)
└── db/                   # Drizzle Schema 및 Migrations
```

### 3.2. 필수 워크플로우 (꼭 읽어보세요)
- **프론트엔드 표준**: `.agents/workflows/frontend.md` (공통 컴포넌트, `asChild`, 합성 패턴 등)
- **백엔드 TDD**: `.agents/workflows/backend-tdd.md` (Layered Architecture, 테스트 작성법)
- **기획 프로세스**: `.agents/workflows/planning.md`

## 4. 개발 표준 및 규칙 (Rules of Play)

작업 시 다음 규칙을 반드시 준수해야 합니다.

1. **Unopinionated UI**: `src/components/ui`의 컴포넌트는 스타일이 최소화되어 있습니다. 모든 커스텀 스타일은 사용처에서 `className`으로 주입합니다.
2. **Composition Pattern**: 복잡한 UI는 `Card.Header`, `Card.Body`와 같은 합성 컴포넌트 형태로 구성합니다.
3. **asChild Pattern**: 버튼 내부에 링크가 필요한 경우 `<Button asChild><Link ... /></Button>` 형식을 사용합니다.
4. **Query Invalidation**: 데이터를 변경(Mutation)한 후에는 반드시 관련 쿼리를 무효화하여 UI를 동기화합니다.
5. **No forwardRef**: React 19 환경이므로 `forwardRef` 없이 `ref`를 직접 사용합니다.

## 5. 시작하기 (Quick Start)

### 5.1. 환경 설정 및 로컬 실행
```bash
yarn install      # 의존성 설치
yarn dev          # 개발 서버 (http://localhost:3000)
yarn storybook    # 스토리북 (http://localhost:6006)
```

### 5.2. API 추가 및 갱신
1. `src/api-spec/openapi.yaml` 수정.
2. `yarn gen:api` 실행하여 클라이언트 코드 자동 생성.

### 5.3. DB 변경
1. `src/db/schema.ts` 수정.
2. `yarn mig:local` (로컬) 또는 `yarn mig:remote` (배포 서버) 실행.

## 6. 현재 마일스톤 (2026-03-14 기준)

- [x] Auth 도메인 핵심 기능 구현 (로그인/비밀번호 변경 등)
- [x] 공통 UI 컴포넌트 라이브러리 구축 및 7개 주요 페이지 리팩토링 완료
- [x] 스토리북 및 프론트엔드 개발 표준 확립
- [ ] 주요 도메인(WIG, Lead Measure) 실제 API 연동 고도화
- [ ] 대시보드 시각화(차트 등) 추가 작업 예정

---
**주의**: 모든 API 요청은 세션 쿠키(`wig_sid`)를 사용하므로 로컬 개발 시 백엔드 서버와의 CORS 및 쿠키 설정을 확인하십시오.
