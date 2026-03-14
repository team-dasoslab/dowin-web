---
description: 프론트엔드 UI 컴포넌트 개발 및 API 연동 프로세스
---

# 프론트엔드 개발 가이드

이 워크플로우는 WIG 프로젝트의 프론트엔드 UI 컴포넌트 개발 및 API 연동 표준 절차를 정의합니다.

## 1. UI 컴포넌트 개발 원칙

### 공통 컴포넌트 사용 (@src/components/ui)
- 모든 페이지 개발 시 `Button`, `Input`, `Card`, `Badge` 등 `@src/components/ui`에 정의된 공통 컴포넌트를 우선적으로 사용합니다.
- 공통 컴포넌트는 스타일이 강제되지 않은(unopinionated) 상태로 유지하며, 필요한 스타일은 `className` 프로퍼티를 통해 주입합니다.
- 아이콘은 **Lucide React** (`lucide-react`) 라이브러리를 사용합니다.
- **React 19**를 사용하므로 `forwardRef` 없이 `ref`를 직접 전달할 수 있습니다. 위젯 컴포넌트 개발 시 `ref`를 일반 props처럼 구조 분해하여 사용합니다.

### 컴포넌트 합성 (asChild 패턴)
- `Button` 내부에 링크(`Link`)를 배치해야 하는 경우, 반드시 `asChild` props를 사용하여 불필요한 DOM 중첩을 방지합니다.
  ```tsx
  <Button asChild className="...">
    <Link href="/path">내비게이션</Link>
  </Button>
  ```

### 로딩 및 사용자 피드백
- **로딩 상태**: API 요청 중(`isPending`)에는 버튼 내부에 로딩 스피너를 표시하고 버튼을 `disabled` 상태로 처리합니다.
- **알림(Toast)**: 중요 작업 성공 또는 실패 시 `useToast` 훅을 사용하여 사용자에게 즉각적인 시각적 피드백을 제공합니다.

### 컴포넌트 합성 (Composition / Compound Pattern)
- 복잡한 UI는 여러 작은 컴포넌트의 조합으로 구성합니다. (예: `Card.Header`, `Card.Body`).
- `children`을 적극적으로 활용하여 불필요한 props drilling을 방지하고 유연한 레이아웃을 구성합니다.
- 점(.) 표기법을 사용하여 관련 컴포넌트들을 그룹화함으로써 가독성과 사용성을 높입니다.

### 폼 검증 (Zod) 및 에러 처리
- 모든 입력 폼 데이터는 `zod`를 사용하여 스키마를 정의하고 검증합니다.
- 검증 에러 발생 시 `Input` 컴포넌트의 `error` 프로퍼티를 통해 사용자에게 관련 메시지를 명확히 표시합니다.

### 스토리북 문서화
- 새로운 공통 컴포넌트를 추가하거나 기존 컴포넌트에 중요한 기능을 추가할 경우, 반드시 스토리북(@src/components/ui/stories)에 문서를 작성합니다.
- 다양한 변형(Variants)과 상태(Loading, Disabled 등)를 스토리로 구성하여 시각적으로 검증합니다.

## 2. 디렉토리 구조 및 관심사 분리
- **도메인 기반 구조**: 특정 도메인에 종속된 구성 요소들은 `src/app` 하위 도메인 폴더 내의 전용 폴더에 위치시킵니다.
  - UI 컴포넌트: `_components`
  - 도메인 로직(Hooks): `_hooks`
  - 도메인 전용 컨텍스트: `_context`
- **관심사 분리**: 
  - UI 레이어: `src/components/ui` (공통), `src/app/.../_components` (도메인 전용)
  - 로직 레이어: `src/hooks` & `src/context` (공통), `src/app/.../_hooks` & `src/app/.../_context` (도메인 전용)
  - 데이터 레이어: `src/api/generated` (Orval 생성 코드)

## 3. API 연동 프로세스

### OpenAPI 기반 개발
- 모든 API 연동은 [openapi.yaml](file:///Users/hb/Desktop/dev/ixio0330/toy/wig/src/api-spec/openapi.yaml) 명세를 기반으로 합니다.
- API 스펙 변경이 필요한 경우 `openapi.yaml`을 먼저 수정합니다.

### Orval & TanStack Query
- API 클라이언트 코드는 `orval`을 사용하여 자동 생성합니다.
  ```bash
  npm run gen:api
  ```
- 데이터 페칭 및 상태 관리는 생성된 TanStack Query (useQuery, useMutation) 커스텀 훅을 사용합니다.
- 생성된 파일 위치: `@src/api/generated`

### 쿼리 무효화 (Query Invalidation)
- `useMutation`을 통해 서버 데이터가 변경(CUD)된 후에는 반드시 `queryClient.invalidateQueries`를 호출하여 관련 데이터를 최신 상태로 갱신합니다.
- 이를 통해 클라이언트 캐시와 서버 상태 간의 동기화를 보장합니다.

## 4. 스타일링 가이드 (Tailwind CSS 4)
- `@src/app/globals.css`에 정의된 테마 변수(Variables)와 유틸리티 클래스를 사용합니다.
- Linear/Glassmorphism 스타일(예: `.card-linear`, `.btn-linear-primary`)을 유지하여 일관된 시각적 경험을 제공합니다.
