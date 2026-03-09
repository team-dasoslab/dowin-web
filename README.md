# WIG (Wildly Important Goal) - 가장 중요한 목표에 집중하세요

4DX(실행의 4가지 원칙) 방법론을 기반으로 한 목표 관리 및 동기부여 서비스입니다.
기록하기 위한 기록을 넘어, 명확한 승패(Win/Loss) 확인과 실시간 가시성을 통해 강력한 내적 동기부여를 만들어냅니다.

---

## 🚀 Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS v4
- **Database**: Cloudflare D1
- **Deployment**: Cloudflare Workers (via OpenNext `@opennextjs/cloudflare`)
- **Package Manager**: Yarn (v4.10.0)

---

## ✨ Core Concepts (4DX)

- **WIG (가중목)**: 가장 중요한 목표. `X에서 Y까지 특정 기한 내에` 달성하는 구조.
- **Lag Measure (후행지표)**: 최종 결과물. (예: 체중 5kg 감량)
- **Lead Measure (선행지표)**: WIG 달성을 위해 우리가 통제할 수 있는 행동 지표. (예: 주 3회 30분 유산소)
- **Scoreboard (점수판)**: 내가 이기고 있는지 지고 있는지(Win/Loss)를 즉각적으로 보여주는 실시간 현황판.
- **Commitment (공약)**: 주간 회의 혹은 개인 리뷰를 통해 결정하는 다음 주 실행 계획.

---

## 🌟 주요 기능 (Features)

1. **대시보드 (Dashboard & Personal Scoreboard)**
   - "이번 주 나의 승패"를 한 줄로 직관적 노출
   - 전반적인 WIG 달성 게이지와 "이번 주 선행지표 현황" 요약 시각화
   - 팀원들의 진행 상황을 한눈에 볼 수 있는 Team Dashboard 모드
2. **점수판 관리 (Scoreboard Setup)**
   - WIG, 후행지표, 선행지표 생성 및 관리
   - 단순 텍스트 입력을 넘어선 속성 기반 목표 관리 (매일/매주/매월 주기 선택)
   - 4DX 원칙(예측성, 통제 가능성) 툴팁 가이드 및 WIG 연관성 리마인드
3. **일일 기록 (Daily Logging)**
   - 선행지표별로 요일(월~일) O/X 성취를 직관적으로 체크/토글

---

## 📦 Getting Started

### 1. 전제 조건 (Prerequisites)

- [Node.js](https://nodejs.org/en/) (v18 이상 권장)
- [Yarn](https://yarnpkg.com/) (본 프로젝트는 Yarn 패키지 매니저를 엄격히 사용합니다)

### 2. 패키지 설치 및 실행

레포지토리를 클론한 후 종속성을 설치합니다.

```bash
yarn install
```

개발 서버를 실행합니다.

```bash
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 로 접속하여 서비스를 확인할 수 있습니다.

---

## ☁️ Deployment (Cloudflare)

본 프로젝트는 `open-next`를 사용해 Cloudflare Workers 단위로 배포되도록 구성되어 있습니다. (`wrangler.jsonc` 기준)

### 1. 배포 (Deploy)

Cloudflare 계정 연동 후 배포 명령어 스크립트를 실행합니다.

```bash
yarn deploy
```

_(필요 시 브라우저가 열리며 Cloudflare 로그인을 요구할 수 있습니다.)_

### 2. 환경 변수 등록 (Secrets)

배포 후 런타임에 쓰일 비밀 키의 경우(`KAKAOPAY_SECRET_KEY` 등) 아래처럼 명시적으로 Cloudflare Secret에 등록해야 합니다.

```bash
yarn wrangler secret put KEY_NAME
```

---

## 🧪 Development Guidelines

> 💡 더 구체적인 설계나 프로세스는 `docs/planning` 밑의 마크다운 파일, 그리고 `.agents/workflows/` 디렉토리의 워크플로우를 참조합니다.

### 기획 프로세스

기능을 추가하거나 변경할 때 항상 4DX 철학이 가이드가 됩니다. `docs/onboarding.md`를 우선 참고하여 개발에 착수합니다.
