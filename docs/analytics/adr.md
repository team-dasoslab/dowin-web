# Cloudflare Daily Reporter — 설계 문서

> 소규모 SaaS 운영 기준 / Cloudflare Workers Cron + Discord Webhook

---

## 1. 개요

매일 오전 7시 (KST) Cloudflare의 전날 데이터를 수집해 Discord로 전송하는 자동 리포터.
단순 수치 나열이 아니라 **전일 대비 증감**을 포함해 이상 징후를 빠르게 파악하는 데 초점을 맞춘다.

---

## 2. 아키텍처

```
Cron Trigger (22:00 UTC)
    │
    ▼
Cloudflare Worker (cf-daily-reporter)
    │
    ├── Promise.allSettled() ── 병렬 API 호출
    │       ├── Cloudflare GraphQL → 어제 데이터
    │       └── Cloudflare GraphQL → 그저께 데이터 (delta 계산용)
    │
    ├── buildEmbeds()
    │       └── 각 지표 + 전일 대비 증감(delta) 포맷팅
    │
    └── Discord Webhook POST
```

**실행 환경:** Cloudflare Workers (서버리스, 별도 인프라 불필요)

**스케줄:** `0 22 * * *` (UTC) = 매일 07:00 KST

**테스트:** `GET /run` 으로 수동 트리거 가능

---

## 3. 수집 지표 확정

### 3-1. 유지

| 지표                         | 수집 방법                                            | 이유                        |
| ---------------------------- | ---------------------------------------------------- | --------------------------- |
| 총 요청 수                   | `httpRequests1dGroups.sum.requests`                  | 비용 직결, 트래픽 이상 감지 |
| 대역폭                       | `httpRequests1dGroups.sum.bytes`                     | 비용 직결                   |
| 캐시 히트율                  | `cachedRequests / requests`                          | 성능 및 origin 부담 지표    |
| Workers 에러율               | `workersInvocationsAdaptive.sum.errors`              | 장애 감지                   |
| Workers 스크립트별 실행 횟수 | `workersInvocationsAdaptive` grouped by `scriptName` | 어떤 기능이 문제인지 특정   |
| 보안 차단 요청 수            | `firewallEventsAdaptiveGroups.count`                 | 공격 감지                   |
| 공격 유형 분석               | `firewallEventsAdaptiveGroups.dimensions.source`     | WAF / DDoS / 봇 분류        |

### 3-2. 제거

| 지표                 | 제거 이유                                                           |
| -------------------- | ------------------------------------------------------------------- |
| HTTPS 비율           | Cloudflare가 강제 HTTPS — 항상 100%, 노이즈                         |
| 순방문자 / 페이지뷰  | 봇·크롤러 포함으로 실제 유저 수와 괴리. 제품 내 analytics가 더 정확 |
| 공격 출발 국가 TOP 5 | 소규모 단계에서 액션으로 이어지기 어려움. 공격 유형 분석으로 충분   |

### 3-3. 추가

| 지표                       | 수집 방법                                                   | 이유                                                   |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| **5xx 에러율**             | `httpRequests1dGroups` — status 500~599 분류                | origin 서버 장애 감지. Workers 에러율과 별개로 꼭 필요 |
| **4xx 비율**               | `httpRequests1dGroups` — status 400~499 분류                | API 스펙 변경 영향, 잘못된 클라이언트 요청 급증 감지   |
| **Workers p99 CPU time**   | `workersInvocationsAdaptive.quantiles.cpuTimeP99`           | 평균은 정상인데 일부 요청만 느린 경우 감지             |
| **Workers 예상 월 비용**   | 누적 요청 수 × 단가로 추산                                  | 무료 티어(10만 req/일) 초과 여부 미리 파악             |
| **전일 대비 증감 (delta)** | 어제 + 그저께 데이터 동시 조회 후 계산                      | 절대값보다 변화율이 이상 감지에 훨씬 실용적            |
| **R2 스토리지** (조건부)   | `r2StorageAdaptiveGroups`                                   | R2 실사용 시만 포함. 미사용 시 embed 자체를 생략       |
| **느린 API 경로 TOP N**    | `httpRequestsAdaptiveGroups` grouped by `clientRequestPath` | 최적화 필요한 엔드포인트 특정                          |
| **Workers CPU·Wall time**  | `workersInvocationsAdaptive.quantiles`                      | 스크립트별 실제 실행 비용 파악                         |

---

## 4. API 성능 분석 설계

Workers가 느리다는 건 에러율만으로는 안 잡힌다. 에러 없이 느린 경우가 더 위험할 수 있음.
두 레이어를 구분해서 수집한다.

### 4-1. 경로별 응답 시간 — `httpRequestsAdaptiveGroups`

Cloudflare edge 기준 응답 시간을 경로별로 집계. origin까지 도달하는 전체 레이턴시를 반영한다.

**GraphQL 데이터셋:** `httpRequestsAdaptiveGroups`

| 필드                                     | 설명                            |
| ---------------------------------------- | ------------------------------- |
| `dimensions.clientRequestPath`           | URL 경로 (`/api/v1/users` 등)   |
| `dimensions.clientRequestHTTPMethodName` | HTTP 메서드                     |
| `dimensions.edgeResponseStatus`          | 응답 상태 코드                  |
| `quantiles.edgeTimeToFirstByteMs`        | TTFB p50 / p99 (ms)             |
| `quantiles.originResponseDurationMs`     | Origin 응답 시간 p50 / p99 (ms) |
| `sum.visits`                             | 해당 경로 요청 횟수             |

**수집 조건:**

- 정상 응답(2xx, 3xx)만 필터링 — 에러 응답은 성능 지표 왜곡
- `orderBy: [quantiles_edgeTimeToFirstByteMs_p99_DESC]` — p99 기준 느린 순 정렬
- limit 10 — TOP 10 경로

**쿼리 예시:**

```graphql
query SlowAPIs($zoneTag: string, $datetimeStart: Time, $datetimeEnd: Time) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequestsAdaptiveGroups(
        limit: 10
        filter: {
          datetime_geq: $datetimeStart
          datetime_leq: $datetimeEnd
          edgeResponseStatus_geq: 200
          edgeResponseStatus_lt: 400
        }
        orderBy: [quantiles_edgeTimeToFirstByteMs_p99_DESC]
      ) {
        count
        sum {
          visits
        }
        quantiles {
          edgeTimeToFirstByteMs50
          edgeTimeToFirstByteMs99
          originResponseDurationMs50
          originResponseDurationMs99
        }
        dimensions {
          clientRequestPath
          clientRequestHTTPMethodName
        }
      }
    }
  }
}
```

### 4-2. Workers 스크립트별 CPU·Wall Time — `workersInvocationsAdaptive`

CPU time과 wall time의 차이가 크면 외부 I/O 대기(fetch, KV, D1 등)가 병목임을 의미한다.

| 필드                                    | 설명                |
| --------------------------------------- | ------------------- |
| `dimensions.scriptName`                 | 스크립트 이름       |
| `quantiles.cpuTimeP50` / `cpuTimeP99`   | CPU 실행 시간 (µs)  |
| `quantiles.wallTimeP50` / `wallTimeP99` | 실제 경과 시간 (µs) |
| `sum.requests`                          | 실행 횟수           |
| `sum.errors`                            | 에러 횟수           |

**wall time >> cpu time 해석:**

```
wall time이 cpu time보다 훨씬 크다
    → Worker 내부에서 fetch / KV / D1 등 I/O 대기 시간이 길다
    → 외부 호출 최적화 (병렬화, 캐싱) 필요

wall time ≈ cpu time
    → 순수 연산이 병목
    → 로직 최적화 필요
```

### 4-3. 느린 경로 판단 기준

| 지표            | 주의       | 경고         |
| --------------- | ---------- | ------------ |
| TTFB p99        | 500ms 이상 | 1,000ms 이상 |
| Origin 응답 p99 | 300ms 이상 | 800ms 이상   |
| CPU time p99    | 20ms 이상  | 50ms 이상    |
| Wall time p99   | 100ms 이상 | 500ms 이상   |

> 기준값은 서비스 특성에 따라 `wrangler.toml` vars로 조정 가능하게 설계한다.

### 4-4. Discord 표시 형식

```
⚡ API 성능 분석 — 느린 경로 TOP 5 (p99 기준)

경로                        요청수    TTFB p50   TTFB p99   origin p99
GET /api/v1/export          1,203     240ms      ⚠️ 1,842ms   1,610ms
POST /api/v1/search          890      120ms      ⚠️ 980ms      840ms
GET /api/v1/reports/:id      432       80ms        420ms       310ms
GET /api/v1/users           8,201      30ms         95ms        60ms
GET /api/v1/dashboard       5,430      25ms         88ms        52ms

🔧 Workers CPU·Wall Time
script             cpu p50   cpu p99   wall p50   wall p99   I/O 비율
api-handler         2.1ms    38ms      45ms       ⚠️ 520ms     93%
image-processor     8.3ms    62ms      9.1ms        70ms       8%
```

I/O 비율 = `(wall p99 - cpu p99) / wall p99` — 높을수록 외부 호출 병목

---

## 5. 전일 대비 증감 (Delta) 설계

### 4-1. 계산 방식

```
어제 값 - 그저께 값
delta% = ─────────────── × 100
            그저께 값
```

두 날짜 데이터를 `Promise.allSettled()`로 병렬 조회해 응답 시간 영향 최소화.

### 4-2. Discord 표시 형식

```
총 요청 수    12,430   ▲ +8.3% (어제 대비)
5xx 에러율     0.12%   ▲ +210%  ← 빨간 경고
Workers 에러      23   ▼ -15%
```

- 증가: `▲ +N%` — 에러/보안 지표는 빨간 이모지 강조
- 감소: `▼ -N%`
- 변화 없음 (±5% 이내): `— 유지`

### 4-3. 알림 강도 기준

| 상황                            | 처리                                  |
| ------------------------------- | ------------------------------------- |
| 5xx 에러율 전일 대비 +100% 이상 | embed 색상 빨간색 + 별도 `@here` 멘션 |
| Workers 에러율 +200% 이상       | embed 색상 주황색                     |
| 보안 차단 10,000건 이상         | embed 색상 빨간색                     |
| 전 지표 정상 범위               | embed 색상 초록색                     |

---

## 6. Discord 리포트 구성

총 5개 embed, 순서대로 전송.

```
[1] 헤더 — 날짜 + 전체 상태 요약 (정상 / 주의 / 경고)

[2] 트래픽 & 에러
    - 총 요청 수 (delta)
    - 대역폭 (delta)
    - 캐시 히트율 (delta)
    - 5xx 에러율 (delta)
    - 4xx 비율 (delta)

[3] API 성능 분석  ← 신규
    - 느린 경로 TOP 5 (TTFB p50/p99, origin p99, 요청 수)
    - Workers 스크립트별 CPU·Wall time + I/O 비율
    - 기준값 초과 경로 경고 표시

[4] Workers
    - 전체 실행 횟수 (delta)
    - 에러율 (delta)
    - 예상 월 비용

[5] 보안
    - 차단 요청 수 (delta)
    - 공격 유형 분석 (WAF / DDoS / Rate Limit / 봇)

[R2] — USE_R2=true 시에만 추가 embed
```

---

## 7. 환경 변수 및 시크릿

| 키                    | 종류   | 설명                                            |
| --------------------- | ------ | ----------------------------------------------- |
| `CF_API_TOKEN`        | Secret | Analytics Read 권한 필요                        |
| `DISCORD_WEBHOOK_URL` | Secret | 전송 대상 채널 Webhook                          |
| `CF_ZONE_ID`          | Var    | 대상 도메인 Zone ID                             |
| `CF_ACCOUNT_ID`       | Var    | Cloudflare Account ID                           |
| `USE_R2`              | Var    | `"true"` 설정 시 R2 embed 포함 (기본 `"false"`) |

### API 토큰 필요 권한

```
Zone > Analytics          Read
Zone > Firewall Services  Read
Account > Account Analytics  Read
Account > Workers Scripts    Read
Account > R2 Storage         Read  (USE_R2=true 시)
```

---

## 8. 에러 핸들링 전략

- 개별 API 조회 실패 시 해당 embed만 "데이터 없음"으로 대체, 나머지는 정상 전송
- `Promise.allSettled()` 사용으로 하나 실패해도 전체 리포트 중단 없음
- 전체 실패 시 Discord에 에러 메시지 단독 전송
- delta 계산 시 그저께 데이터 없으면 증감 표시 생략 (첫날 실행 등)

---

## 8. 파일 구조

```
cf-daily-reporter/
├── src/
│   ├── index.js          # Worker 진입점, scheduled/fetch 핸들러
│   ├── analytics.js      # Cloudflare GraphQL 조회 함수
│   ├── delta.js          # 전일 대비 증감 계산
│   ├── embeds.js         # Discord embed 빌드
│   └── discord.js        # Webhook 전송
├── wrangler.toml
└── package.json
```

---

## 9. 구현 순서

1. `analytics.js` — GraphQL 쿼리 (어제 + 그저께 병렬)
2. `delta.js` — 증감률 계산 유틸
3. `embeds.js` — Discord embed 포맷팅 (delta 포함)
4. `discord.js` — Webhook 전송
5. `index.js` — 조립 + Cron 핸들러
6. wrangler 배포 + `/run` 수동 테스트
