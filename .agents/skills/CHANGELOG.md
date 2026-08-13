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

### [2026-08-13] code-review 지적 사항 반영 (pr-review-gate.mjs 버그 수정 + 서브에이전트 채점 위임 확대)

- **변경 스킬:** `scripts/pr-review-gate.mjs`, `.github/workflows/pr-review-gate.yml`, `dowin-backend-quality-check`/`dowin-frontend-quality-check`(off-by-one 문구 수정), `dowin-backend-security-check`/`dowin-backend-performance-check`/`dowin-frontend-security-check`/`dowin-frontend-performance-check`(신규 "서브에이전트에게 채점 위임" 1단계 추가)
- **변경 이유:** 이 브랜치를 `/code-review`로 검토한 결과 실제 버그가 여러 건 확인됨: (1) 워크플로우가 2-dot `git diff base.sha head.sha`를 써서 PR 열린 뒤 main에 머지된 무관한 변경까지 섞여 들어옴, (2) `.claude/settings.json` 같은 권한 설정 파일이 harness-security-check RULES에서 빠져 있어 권한 완화 PR이 감지되지 않음, (3) `src/app/api/**`와 `src/app/**` 룰이 겹쳐 백엔드 전용 PR에도 frontend-quality-check가 잘못 붙음(직접 실행해 재현 확인), (4) 같은 diff에서 Workflow를 4단계로 재번호 매기면서 "아래 2~3단계" 문구를 안 고쳐 off-by-one 발생, (5) fresh-context 서브에이전트 채점 위임이 quality-check에만 적용되고 같은 체인의 security/performance-check는 self-grading으로 남아 있었음, (6) 실행되지도 않는 Corepack/yarn 셋업 스텝, (7) `changed-files.txt`가 없을 때 스크립트가 그냥 크래시함.
- **기대 효과:** 3-dot diff로 PR 자체 변경만 잡고, 권한 설정 파일 변경이 harness-security-check로 이어지고, 백엔드 전용 PR에 frontend 체크가 잘못 붙지 않고, 4개 -check 스킬 전부 self-grading bias 완화가 일관되게 적용되고, 워크플로우가 불필요한 셋업 없이 더 빠르고, 스크립트가 입력 누락에도 죽지 않고 안내 메시지를 남긴다.
- **관련 실패 카테고리:** `missing_test`(직접 실행 재현 없이 머지됐던 규칙 겹침 버그), `doc_impl_drift`(재번호 매김 후 안 고친 문구)
- **Follow-up Eval 필요 여부:** [ ] 네 / [x] 아니오

### [2026-08-13] AGENTS.md 분량/중복 정리 (314→284줄)

- **변경 스킬:** `AGENTS.md`
- **변경 이유:** §8.3(A2/A4) 채점에서 지적한 대로, `AGENTS.md`가 논문 기준(Context Bloat, ≥200줄) 대비 길었고 "any 타입 금지" 규칙이 `eslint.config.mjs:30`의 `@typescript-eslint/no-explicit-any: error`와 순수 중복(Lint Leakage)이었다. beads 자동 생성 블록(`<!-- BEGIN BEADS ... -->`)은 `bd setup`이 관리하므로 건드리지 않았다.
- **기대 효과:** "Strict Type Constraints" 항목을 린터가 이미 막는 부분(any 금지)은 참조로 줄이고, 린터가 못 막는 부분(`@ts-ignore`/`eslint-disable` 우회 금지)만 남겼다. "Skill file locations"의 스킬명 전체 재나열을 제거하고, "Trigger examples"를 스킬당 1개(핵심 게이트인 `dowin-intake`만 2개)로 줄였다. 순수 hand-authored 분량이 228줄 → 200줄로 줄었다 (beads 자동 블록 제외).
- **관련 실패 카테고리:** `over_engineering`(불필요한 반복 서술 제거)
- **Follow-up Eval 필요 여부:** [ ] 네 / [x] 아니오

### [2026-08-13] MCP Tool Policy 문서 신설 (Linear/CodeGraph 범위)

- **변경 스킬:** `docs/dev/common/2026.08.13-mcp-tool-policy.md`(신설), `docs/dev/common/2026.08.13-context-packets.md`(Harness/Security Packet에 포인터 추가)
- **변경 이유:** §4.7/§8.5(갭 6번)에서 지적한 MCP/tool 운영 기준 부재 중, 실제로 이 저장소에 연결돼 있는 Linear/CodeGraph MCP 두 가지만 범위로 좁혀 우선 문서화하기로 사용자와 합의함 (신규 도구 승인 기준, 배포/DB 접근 범주는 이번 범위 밖).
- **기대 효과:** Linear/CodeGraph MCP가 왜 신뢰되는지, 무슨 데이터가 오가는지, 결과를 받기 전 뭘 확인해야 하는지가 문서로 남아, 하네스 보안 리뷰(`dowin-harness-security-check`) 때 참고할 수 있다.
- **관련 실패 카테고리:** `secret_exposure_risk`(MCP 데이터 흐름 불투명성 완화)
- **Follow-up Eval 필요 여부:** [ ] 네 / [x] 아니오

### [2026-08-13] Context Packet 문서화 (`context-packets.md`) 및 6개 스킬 연결

- **변경 스킬:** `docs/dev/common/2026.08.13-context-packets.md`(신설), `dowin-backend-api-spec`/`dowin-backend`/`dowin-frontend-api-connect`(JIT Search Strategy에 포인터 추가), `frontend-webview`/`dowin-harness-security-check`/`dowin-product-updates`(Start with 목록에 포인터 추가)
- **변경 이유:** `docs/planning/2026.07.13-ai-engineering-application-plan.md` §4.6에서 설계했던 작업유형별 Context Packet(먼저 볼 파일/금지 사항/검증 명령)이 계획 문서 안 산문으로만 있고, 각 스킬이 이를 가리키지 않아 매 작업마다 같은 탐색을 반복하고 있었다 (§8.5 갭 5번).
- **기대 효과:** 6개 스킬이 작업 시작 시 해당 Context Packet을 먼저 확인해, 반복 탐색 비용을 줄이고 그 작업 유형에서 흔히 놓치는 금지 사항(OpenAPI 먼저 갱신, webview fallback 검증 등)을 놓치지 않는다.
- **관련 실패 카테고리:** `scope_gap`(탐색 범위가 매번 새로 정해지는 문제)
- **Follow-up Eval 필요 여부:** [ ] 네 / [x] 아니오

### [2026-08-13] 장기 세션용 progress 파일 패턴(`Session Continuity`) 신설

- **변경 스킬:** `AGENTS.md`(신규 "Session Continuity (Long-Running Tasks)" 섹션), `codex.md`(신규 "2.5. 세션 연속성" 섹션), `.gitignore`(`.dowin/progress/` 추가)
- **변경 이유:** 세션이 끊겼다가(컨텍스트 압축, 새 대화, 다른 LLM으로 인계) 재개될 때 지금까지는 beads 이슈 상태와 git 커밋만으로 이어받았는데, 이는 "무엇을 했는지"만 알려주고 "왜 어떤 접근을 버렸는지, 뭐가 막혔는지"는 남기지 못했다 (Anthropic "Effective harnesses for long-running agents"의 progress 파일 패턴 근거, §8 리서치).
- **기대 효과:** 여러 세션에 걸칠 것으로 예상되는 작업은 `.dowin/progress/<branch-slug>.md`(gitignore)에 시도/막힘/다음시도/열린질문을 이어붙여 기록하고, 새 세션은 재탐색 전에 이 파일부터 확인한다. 작업 종료 시 삭제하거나 장기 가치가 있으면 CHANGELOG/planning 문서/`bd remember`로 승격한다.
- **관련 실패 카테고리:** `doc_impl_drift`(세션 간 맥락 유실로 인한 재작업 방지)
- **Follow-up Eval 필요 여부:** [x] 네 / [ ] 아니오 — 실제로 세션 재개 상황에서 이 파일이 쓰이는지, 도움이 되는지 관찰 필요

### [2026-08-13] backend/frontend-quality-check를 fresh-context 서브에이전트 채점으로 전환

- **변경 스킬:** `dowin-backend-quality-check`, `dowin-frontend-quality-check` (Workflow에 "서브에이전트에게 채점 위임" 1단계 신설, Output Contract 문구 수정)
- **변경 이유:** 리서치(`docs/planning/2026.07.13-ai-engineering-application-plan.md` §8) 결과, 구현("dowin-backend"/"dowin-frontend-_")과 채점("_-quality-check")이 스킬은 분리돼 있어도 같은 대화 컨텍스트에서 이어지는 경우가 많아, 방금 자기가 만든 코드를 스스로 채점하는 self-grading bias 위험이 있었다(Anthropic "Effective harnesses for long-running agents" 근거).
- **기대 효과:** quality-check 스테이지가 구현 대화를 본 적 없는 새 서브에이전트(Claude Code는 `Agent` 툴 `general-purpose`)에게 diff+체크리스트만 넘겨 채점하도록 바뀌어, 평가가 구현 당시 판단을 그대로 재확인하는 것을 줄인다. 서브에이전트를 못 띄우는 하네스는 최소한 요약된 새 세션에서 시작하도록 완화 규칙을 둠.
- **관련 실패 카테고리:** `over_engineering`(자기 채점으로 인한 안일한 pass 판정 방지)
- **Follow-up Eval 필요 여부:** [x] 네 / [ ] 아니오 — 다음 몇 건의 quality-check 실행에서 실제로 subagent 위임이 이뤄지는지, pass/needs_revision 판정 비율이 달라지는지 관찰 필요

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
