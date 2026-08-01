# AI Skills Changelog

이 문서는 Dowin 프로젝트 내의 AI 에이전트용 스킬(`.agents/skills/*`) 및 프롬프트가 변경된 이력을 추적합니다.
AI가 겪은 실패 사례를 바탕으로 스킬을 갱신하고, 그 효과를 검증하기 위해 사용됩니다.

## 템플릿 (Template)

새로운 스킬 변경이 있을 때 파일 상단에 아래 양식을 복사하여 기록합니다.

### 실패 카테고리 (Failure Categories)

이 파일의 표를 AI 작업 실패 카테고리의 최신 기준으로 사용합니다.
`관련 실패 카테고리`에는 아래 항목 중 하나 이상을 선택하여 기입합니다.

| 카테고리                | 의미                           | 설명                                                                                                                                       |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `scope_gap`             | 범위 정의 문제                 | 작업 범위, non-goal, 수정 대상이 충분히 좁혀지지 않아 결과가 흔들린 경우입니다.                                                            |
| `mvp_boundary_gap`      | MVP/Post-MVP 경계 문제         | 지금 해야 할 범위와 후속 범위가 섞여 구현 또는 문서가 과도해진 경우입니다.                                                                 |
| `api_contract_mismatch` | API 스펙/구현 불일치           | OpenAPI 스펙(`openapi.yaml`)과 실제 서버의 핸들러 응답 및 Zod 검증 로직이 서로 다를 때 발생합니다.                                         |
| `schema_design_gap`     | 스키마 설계 문제               | DB/API/domain schema 변경이 현재 도메인 규칙이나 후속 확장과 맞지 않는 경우입니다.                                                         |
| `missing_validation`    | 검증 누락                      | 외부 입력, query, payload, 상태 전이에 대한 Zod 또는 도메인 검증이 빠진 경우입니다.                                                        |
| `missing_test`          | 테스트 누락                    | 새로운 비즈니스 로직이나 예외 처리를 추가했음에도, 이를 검증하기 위한 단위 테스트나 통합 테스트를 작성하지 않은 경우입니다.                |
| `state_handling_gap`    | 상태 처리 누락                 | 로딩, 빈 상태, 에러, pending, disabled, optimistic state 같은 UI 상태 처리가 빠진 경우입니다.                                              |
| `rollback_gap`          | 롤백 처리 누락                 | 낙관적 업데이트나 실패 복구가 필요한 변경에서 롤백 또는 오류 복구가 빠진 경우입니다.                                                       |
| `performance_scan_risk` | 반복 스캔 위험                 | 데이터 규모가 커질 때 반복 scan이나 비효율적 순회가 병목이 될 수 있는 경우입니다.                                                          |
| `n_plus_one_risk`       | N+1 위험                       | 루프 내부 DB/API 호출처럼 입력 크기에 따라 쿼리 수가 비정상적으로 증가할 수 있는 경우입니다.                                               |
| `query_width_risk`      | 과도한 조회 폭 위험            | 필요한 범위를 넘어 많은 컬럼/행/관계를 읽어 성능 또는 비용 문제가 생길 수 있는 경우입니다.                                                 |
| `auth_gap`              | 인증 누락                      | 인증이 필요한 경로에서 session 확인 또는 로그인 상태 처리가 빠진 경우입니다.                                                               |
| `ownership_gap`         | 소유권/권한 필터링 누락        | 사용자/워크스페이스/멤버십 기준 소유권이나 역할 검사가 빠진 경우입니다.                                                                    |
| `secret_exposure_risk`  | 비밀값 노출 위험               | 토큰, API 키, 쿠키, private endpoint 같은 민감정보가 코드/문서/로그에 노출될 수 있는 경우입니다.                                           |
| `doc_impl_drift`        | 문서-구현 불일치               | 코드 로직이 변경되었음에도 관련 문서(`README.md`, 온보딩, 기획 문서 등)를 업데이트하지 않았거나 문서가 실제 구현과 달라진 경우입니다.      |
| `unrelated_refactor`    | 관련 없는 리팩터링 / 과잉 수정 | 사용자가 지시한 범위를 벗어나서 임의로 파일 구조를 바꾸거나, 주석을 지우거나, 관련 없는 코드를 수정하여 리뷰 노이즈를 발생시킨 경우입니다. |
| `over_engineering`      | 오버 엔지니어링                | 단순한 기능 요구사항에 대해 과도하게 복잡한 패턴(불필요한 추상화, 너무 많은 분리 등)을 적용하여 유지보수를 어렵게 만든 경우입니다.         |

```markdown
### [YYYY-MM-DD] 대상 스킬 이름

- **변경 스킬:** `dowin-xxx`
- **변경 이유:** (어떤 상황에서 AI가 자주 실패/실수했는가?)
- **기대 효과:** (수정 후 AI의 동작이 어떻게 달라질 것으로 기대하는가?)
- **관련 실패 카테고리:** (예: `missing_test`, `over_engineering` 등 위 허용 카테고리 중 하나 이상 선택)
- **Follow-up Eval 필요 여부:** [ ] 네 / [x] 아니오
```

---

## 변경 이력

### [2026-08-01] 시크릿 파일 읽기 금지 + 프로덕션 명령 컨펌 하드룰 추가

- **변경 스킬:** `AGENTS.md`/`codex.md`(신규 "Safety Guardrails"/"§1.5 안전 규칙" 섹션), `.claude/settings.json`(신규 `permissions.deny`), `dowin-backend-api-spec`/`dowin-backend`(mig:remote 문구 강화), `dowin-harness-security-check`(체크리스트 추가)
- **변경 이유:** 사용자가 `.env`/`.dev.vars` 등 시크릿 파일을 절대 읽지 말 것과, `yarn mig:remote` 같은 프로덕션/원격 영향 명령은 매번 실행 직전 명시적 컨펌을 받도록 강력한 규칙을 요청함.
- **기대 효과:** Claude Code는 `.claude/settings.json`의 `permissions.deny`로 `.env*`/`.dev.vars*` 읽기가 기계적으로 차단됨. Codex/Antigravity를 포함한 모든 LLM은 `AGENTS.md`/`codex.md`의 프로세 규칙으로 동일하게 금지됨. `yarn mig:remote`/`yarn deploy`/원격 `wrangler`/공유 원격 `git push`·`bd dolt push`는 이전 대화의 일반 승인이 이어지지 않고, 실행 직전 매번 재확인이 필요함.
- **관련 실패 카테고리:** `secret_exposure_risk`
- **Follow-up Eval 필요 여부:** [ ] 네 / [x] 아니오

### [2026-08-01] Output Contract 최소 공통 코어 통일

- **변경 스킬:** `dowin-intake`/`dowin-commit`/`dowin-release`(status 값 통일), `dowin-harness-security-check`(Output Contract 신설), `docs/planning/2026.04.09-dowin-agent-orchestration.md` §8
- **변경 이유:** 스킬마다 `status` 값 종류(`pass|hold|reject` vs `pass|needs_revision|fail` vs `pass|fail`)와 필드 구성이 달라, 체이닝할 때 "이 값이 진행 가능 상태인지"를 스테이지마다 다시 판단해야 하는 위험이 있었다.
- **기대 효과:** 모든 스킬이 `stage`/`status`/`summary`/`next_step` 최소 공통 코어를 갖고, `status`는 예외 없이 `pass|needs_revision|fail`이며 `pass`만 "다음 단계 진행"을 의미한다. `findings`/`return_to`/`intent`/`focus_list`/`evaluation_result`/`commits`/`pr_url` 같은 스테이지 전용 필드는 억지로 통일하지 않고 필요한 곳에만 유지.
- **관련 실패 카테고리:** `doc_impl_drift`, `over_engineering`(전면 통일 대신 최소 코어만 강제)
- **Follow-up Eval 필요 여부:** [ ] 네 / [x] 아니오

### [2026-08-01] 커밋 컨벤션 스킬(`dowin-commit`) 신설 + 4단계 커밋 체크포인트

- **변경 스킬:** `dowin-commit`(신설), `backend-api-spec`/`backend`/`frontend-ui`/`frontend-api-connect`/`backend-quality-check`/`backend-performance-check`/`backend-security-check`/`frontend-quality-check`/`frontend-performance-check`/`frontend-security-check`/`release`(Next Step·Output Contract 수정)
- **변경 이유:** `docs/planning/2026.04.09-commit-convention.md`가 문서로만 있고 이를 매번 참조하도록 강제하는 스킬이 없었다. 또한 커밋이 `dowin-release` 한 번에 몰아서 발생하는 구조로 오해될 여지가 있었는데, 실제로는 backend-api-spec/backend/frontend-ui/frontend-api-connect 4개 코드 생성 스테이지가 각각 자신의 quality(+performance/security) 체크를 통과한 직후 개별적으로 커밋해야 한다.
- **기대 효과:** 커밋 메시지가 `feat|fix|docs|chore|refactor|style` 컨벤션과 "한 커밋 = 한 의도" 원칙을 항상 따르게 됨. 4번의 작은 커밋으로 나뉘어 리뷰 단위가 명확해지고, `dowin-release`는 새로 커밋을 만들지 않고 이미 존재하는 커밋들을 squash-merge하기만 함.
- **관련 실패 카테고리:** `doc_impl_drift`, `unrelated_refactor`
- **Follow-up Eval 필요 여부:** [x] 네 / [ ] 아니오 (스테이지당 커밋 1개가 실제로 지켜지는지, api-spec/frontend-ui 단계의 quality-check가 너무 가볍거나 무거운지 재검토)

### [2026-08-01] 에이전트 오케스트레이션 v2 — intake/release 신설, backend/frontend/quality-performance-security 세분화

- **변경 스킬:** `dowin-orchestrator`(삭제), `dowin-intake`/`dowin-backend-api-spec`/`dowin-backend-quality-check`/`dowin-backend-performance-check`/`dowin-backend-security-check`/`dowin-frontend-ui`/`dowin-frontend-api-connect`/`dowin-frontend-quality-check`/`dowin-frontend-performance-check`/`dowin-frontend-security-check`/`dowin-release`(신설), `dowin-planning`/`dowin-backend`/`frontend-webview`/`grill-me`(수정)
- **변경 이유:** `dowin-orchestrator`가 설명 기반 암묵적 트리거에 의존해 실제로 거의 호출되지 않았고(`codex.md` 라우팅 표에서도 누락), `AGENTS.md`의 "Skill Consultation First" 규칙이 그 자리를 대신 가로채고 있었다. 또한 사용자가 (1) Linear 이슈 생성 여부를 세션 시작 시 항상 확인하길 원했고, (2) planning이 PRD 없이 action item만 내던 문제가 있었고, (3) backend/frontend/quality-performance-security를 도메인별로 더 잘게 쪼개 체이닝하길 원했고, (4) 작업 완료 기준을 PR 머지·브랜치 정리·Linear 종료까지로 명확히 하길 원했다.
- **기대 효과:** 모든 비-trivial 작업이 `dowin-intake`에서 시작해 `dowin-release`에서 끝나는 고정 체인을 타게 되어, Claude Code/Codex/Antigravity 어떤 LLM으로 작업해도 동일한 절차를 따른다. beads가 Linear 이슈당 epic + 스테이지별 child 이슈로 진행 상태를 추적해 세션/LLM이 바뀌어도 복구 가능. 판단이 필요한 지점은 `grill-with-docs`로 표준화. 모든 스킬이 `.claude/skills/`에도 미러링되어 Claude Code에서 처음으로 실제 Skill로 호출 가능해짐.
- **관련 실패 카테고리:** `scope_gap`, `doc_impl_drift`, `mvp_boundary_gap`
- **Follow-up Eval 필요 여부:** [x] 네 / [ ] 아니오 (2주 정도 실사용 후 intake 적용 범위, frontend-ui→frontend-api-connect 순서, PRD를 별도 파일로 분리할지 재검토)

### [2026-07-15] 프론트엔드 다국어(I18n) 및 Zod 입력값 검증 기준 강화

- **변경 스킬:** `dowin-frontend`, `dowin-backend`, `dowin-quality-check`
- **변경 이유:** 작업 품질 평가 시 프론트엔드의 다국어 처리(I18n) 누락 및 프론트엔드/백엔드 공통의 외부 입력값에 대한 Zod 검증 누락이 발견되어 명시적 확인이 필요했습니다.
- **기대 효과:** 프론트엔드 작업 시 하드코딩된 UI 문자열 사용을 방지하고, 모든 외부 입력(API Payload, 폼 입력 등)에 대해 엄격한 Zod 검증을 필수적으로 적용하여 보안과 품질을 높입니다.
- **관련 실패 카테고리:** `missing_validation`, `state_handling_gap`
- **Follow-up Eval 필요 여부:** [ ] 네 / [x] 아니오

### [2026-07-14] 초기 Changelog 파일 생성

- **변경 스킬:** 없음
- **변경 이유:** 기획 문서 `2026.07.13-ai-engineering-application-plan.md`에 따라 스킬 변경 이력 추적 체계를 도입함.
- **기대 효과:** 프롬프트의 지속적인 개선 루프 구축.
- **관련 실패 카테고리:** N/A
- **Follow-up Eval 필요 여부:** 아니오
