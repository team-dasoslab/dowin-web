# WIG 프로젝트 온보딩 가이드 (AI Agent용)

이 문서는 AI Agent가 WIG 프로젝트의 맥락을 빠르게 파악하고 작업을 시작할 수 있도록 돕기 위해 작성되었습니다.

## 1. 프로젝트 개요

- **서비스 명**: WIG (Wildly Important Goal)
- **핵심 컨셉**: 4DX(실행의 4가지 원칙) 방법론을 기반으로 한 목표 관리 및 동기부여 서비스.
- **주요 타겟**: 사용자 본인의 내적 동기부여 및 실행력 강화 (지인들과의 4DX 소모임 맥락 포함).
- **디자인 컨셉**: 노션(Notion) 스타일의 깔끔하고 모던한 대시보드.

## 2. 핵심 도메인 용어 (4DX 기반)

- **WIG (가중목)**: 가장 중요한 목표. `X에서 Y까지 특정 기한 내에` 달성하는 형식.
- **Lead Measure (선행지표)**: WIG 달성을 위해 우리가 통제할 수 있는 행동 지표. (예: 주 3회 운동)
- **Lag Measure (후행지표)**: 최종 결과물. (예: 체중 5kg 감량)
- **Scoreboard (점수판)**: 내가 이기고 있는지 지고 있는지(Win/Loss)를 보여주는 실시간 현황판.
- **Commitment (공약)**: 주간 회의에서 결정하는 다음 주 실행 계획.

## 3. 주요 문서 및 워크플로우

### 3.1. 기획 및 설계
- **기획 개요**: `docs/planning/2026.03.09-service-overview.md`
- **상세 설계**: `docs/planning/2026.03.09-detailed-design.md`
- **기획 프로세스 가이드**: `.agents/workflows/planning.md`

### 3.2. 기술 문서 및 가이드
- **백엔드 TDD 개발 프로세스**: `.agents/workflows/backend-tdd.md`
- **API 명세 (OpenAPI)**: `src/api-spec/openapi.yaml`
- **인증(Auth) 작업 결과**: 
  - 백엔드: `docs/dev/auth/2026.03.14-backend.md`
  - 프론트엔드: `docs/dev/auth/2026.03.14-frontend.md`

## 4. 현재 진행 상태 (2026-03-14 기준)

1. **서비스 기획 및 설계 완료**: 전체적인 컨셉, 상세 설계, DB 스키마 정의 완료.
2. **백엔드 아키텍처 구축**:
   - Controller-Service-Storage 레이어드 아키텍처 및 TDD 환경 구축.
   - Auth 도메인 핵심 API(로그인, 로그아웃, 비밀번호 변경, 관리자용 유저 생성) 구현 완료.
3. **프론트엔드 API 인프라 구축**:
   - **TanStack Query** 기반의 서버 상태 관리 체계 도입.
   - **Orval**을 이용한 OpenAPI 명세 기반 API 클라이언트 자동 생성 환경 구축.
   - 세션 쿠키(`wig_sid`) 처리를 위한 커스텀 Mutator(`src/api/mutator.ts`) 구현.
4. **프로토타입 기능 연동**:
   - 로그인/로그아웃 및 실시간 비밀번호 변경 기능 실제 API 연동 완료.
   - `isFirstLogin` 상태에 따른 신규 사용자 온보딩(/setup) 유도 로직 구현.
5. **푸시 알림 기능 (구현 완료)**: 브라우저 알림(Service Worker)을 통한 선행지표 기록 유도 시스템.
6. **UI/UX 폴리싱**: 노션 스타일의 미니멀 대시보드 및 커스텀 토스트 시스템 적용.

## 5. 개발 시작하기 (Workflow)

### 5.1. 초기 설정
```bash
# 의존성 설치
yarn install

# 로컬 개발 서버 실행 (프론트/백 동시 실행 환경 확인 필요)
yarn dev
```

### 5.2. API 추가 및 변경
1. `src/api-spec/openapi.yaml` 파일에 API 명세 추가.
2. 다음 명령어로 API 클라이언트 코드 생성:
   ```bash
   yarn gen:api
   ```
3. `src/api/generated/` 하위에 생성된 Hook들을 컴포넌트나 컨텍스트에서 사용.

### 5.3. 데이터베이스 스키마 동기화 (Migration)
1. `src/db/schema.ts` 수정.
2. 로컬 DB 반영 (D1 로컬 개발용):
   ```bash
   yarn mig:local
   ```
3. 원격 DB 반영 (Cloudflare D1 배포용):
   ```bash
   yarn mig:remote
   ```

### 5.4. 백엔드 개발 (TDD)
- 새로운 API나 비즈니스 로직 작성 시 `.agents/workflows/backend-tdd.md` 가이드를 반드시 준수하십시오.

## 6. 작업 시 주의사항

- **쿠키 기반 보안**: 인증은 세션 쿠키(`wig_sid`)를 사용하므로, API 호출 시 `withCredentials: true` 가 포함된 Mutator를 사용해야 합니다.
- **AI 정렬**: 작업을 시작하기 전 `docs/dev/` 하위의 최신 작업 결과 문서들을 읽고 최신 맥락을 파약하십시오.
