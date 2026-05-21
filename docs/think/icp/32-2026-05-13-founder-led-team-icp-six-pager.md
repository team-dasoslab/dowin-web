# Dowin ICP 6-Pager: Founder-led 소규모 팀 가설

작성일: 2026-05-13

## 1. 서문

Dowin의 현재 가장 중요한 질문은 `무슨 기능을 더 만들까`가 아니다.  
지금 더 중요한 질문은 `누구의 어떤 운영 문제를 가장 먼저 풀어야 하는가`다.

그동안의 제품/기획/회고를 종합하면, Dowin은 개인 생산성 도구나 일반 협업툴보다 아래 문제에 더 가까운 제품이다.

- 중요한 실행이 바쁜 일상 속에서 흐려진다
- 상태가 여러 채널에 흩어져 리더가 shared picture를 늦게 본다
- 회의가 실행 회의보다 상태 재구성 회의가 된다
- 후속 확인이 약해 결국 리더가 직접 chase하게 된다

이 문서는 그중에서도 `대표가 직접 운영을 chase하는 founder-led 소규모 팀`을 Dowin의 현재 1순위 ICP 후보로 보고, 온라인 공개 자료를 통해 어떤 pain가 반복되는지 정리한 6-pager다.

이 문서의 목적은 아래 세 가지다.

1. founder-led 소규모 팀이 실제로 어떤 언어로 문제를 말하는지 정리한다
2. Dowin가 왜 이 세그먼트와 맞을 가능성이 있는지 설명한다
3. 아직 확정되지 않은 부분과 다음 검증 단계를 분리한다

이 문서는 `최종 ICP 확정 문서`가 아니다.  
현재 시점의 가장 강한 1순위 가설을 정리한 `의사결정 지원 문서`다.

## 2. 고객 가설

현재 가장 유력한 1순위 ICP 후보는 아래에 가깝다.

`8~20인 안팎의 founder-led B2B 팀에서, 대표의 오른팔 역할을 하는 Chief of Staff/COO-lite/ops lead 또는 대표 본인이 주간 우선순위와 후속 확인을 직접 챙기고 있으며, Slack·Notion·Google Docs·간단한 시트 조합으로 운영은 돌아가지만 이번 주 shared picture를 빠르게 만들기 어려운 팀`

이 고객 가설의 핵심 조건은 다섯 가지다.

### 2.1. 팀 규모가 너무 작지도 크지도 않다

- 1~2인 팀은 shared picture 문제보다 개인 집중 문제에 가깝다
- 너무 큰 조직은 도입 구조와 의사결정 구조가 복잡해진다
- 5~15인 정도는 founder dependency가 남아 있으면서도 coordination cost가 실제 pain가 되기 시작하는 구간이다

### 2.2. founder 또는 리더가 실제로 운영 통합자 역할을 한다

이 세그먼트는 아래 장면이 있어야 한다.

- 중요한 상태를 결국 대표가 다시 물어본다
- 누가 owner인지 다시 정리한다
- 회의에서 처음 shared picture가 만들어진다
- follow-up이 흐려지면 대표나 CoS가 다시 붙는다

### 2.3. 목표와 실행은 있으나 한 화면에서 연결되지 않는다

- 목표는 Notion에 있다
- 업데이트는 Slack에 있다
- 결정은 회의에서 났다
- 다음 액션은 각자 머릿속이나 개인 메모에 남는다

즉 `도구가 아예 없는 팀`보다 `도구는 있는데 상태가 연결되지 않는 팀`이 더 가깝다.

### 2.4. 주간 단위의 operating rhythm이 중요하다

이 팀은 보통 아래 구조를 갖는다.

- 주간 우선순위를 맞춘다
- 주간 회의나 체크인이 있다
- blocker와 decision이 주중에 생긴다
- 다음 액션과 due가 주간 cadence 안에서 의미를 가진다

Dowin은 일회성 프로젝트 관리보다 이런 반복 cadence와 더 잘 맞는다.

### 2.5. 디지털 습관은 있지만 PM 툴 성숙도는 높지 않다

- 완전 오프라인 팀은 도입이 무겁다
- 반대로 Jira/Linear/Asana가 아주 깊게 깔린 팀은 기존 대안이 강하다
- Slack, Notion, Google Docs, 간단한 시트 조합으로 굴러가는 founder-led 팀이 현재 Dowin와 가장 가까운 중간 구간이다

중요한 점은 이 팀이 `정리되지 않은 팀`이 아니라는 것이다.

- 이미 주간 회의도 한다
- 문서도 남긴다
- 우선순위도 말로는 맞춘다
- 각자 업데이트도 한다

문제는 운영이 아예 없는 것이 아니라, 그 운영이 여러 표면에 나뉘어 있어 founder나 운영 리더가 매번 다시 엮어야 한다는 데 있다.

즉 Dowin의 첫 진입점은 `아무 툴도 없는 팀`이 아니라 `툴은 충분한데 주간 실행 운영 레이어가 없는 팀`이다.

이 가설은 도구 보급 자료와도 크게 어긋나지 않는다.

- Notion은 startup 대상 페이지에서 `Docs, projects, and wikis`를 한 워크스페이스로 제시하고, `50% of YC companies use Notion`, `70% of users replaced 2+ tools`라고 설명한다
- Google Workspace는 `Docs, Sheets and Slides`를 팀 협업 기본 도구로 제시하고, `project trackers in Google Sheets`로 shared goals와 tasks를 함께 관리할 수 있다고 설명한다

즉 `Notion + Google Docs/Sheets + Slack` 조합은 특이한 예외라기보다 초기 운영 스택의 유력한 기본값으로 볼 수 있다.

### 2.6. 첫 챔피언은 founder보다 founder의 오른팔일 가능성이 높다

이 세그먼트에서 pain를 가장 먼저 느끼는 사람은 항상 founder 본인만은 아니다.

- Chief of Staff
- COO-lite
- biz ops / ops lead
- 운영 리더

이들은 실제로 다음 역할을 맡는 경우가 많다.

- 회의 전에 상태를 취합한다
- owner와 due를 다시 정리한다
- Notion 문서와 시트를 관리한다
- Slack에서 follow-up을 다시 건다

공개 자료에서도 이 패턴이 반복된다.

- founder-led scale-up에서 첫 제약은 formal operational ownership보다 `CEO leverage`이며, Chief of Staff가 `clarity`, `follow-through`, `decision support`를 제공한다는 설명이 나온다
- 실제 Chief of Staff 채용 공고도 `keep me organized`, `builds the spreadsheet`, `creates the Notion template`, `sets the reminder` 같은 역할을 전면에 둔다

따라서 Dowin의 첫 아하 모먼트는 `대표`보다 `대표 대신 매주 shared picture를 다시 만드는 사람`에게 더 강하게 올 가능성이 높다.

## 3. 관찰된 문제

온라인 pain research에서 반복된 문제는 크게 다섯 묶음으로 정리된다.

### 3.1. 회의가 상태 재구성 자리가 된다

여러 자료에서 반복된 핵심은 이거다.

- standup이나 weekly sync가 단순 sync가 아니라 leadership visibility를 얻는 유일한 자리처럼 변한다
- 회의 전에 상태가 준비되지 않아 회의 안에서 현재 상황을 다시 조립한다
- 그 결과 회의는 문제 해결보다 status reconstruction에 시간을 쓴다

이건 추상적 표현만이 아니다.

- 2026년 3월 `r/startups` 스레드에서는 standup이 `leadership visibility를 얻는 유일한 자리`가 되고, `priorities drifting`, `context scattered across Slack threads`, `different people having different assumptions about progress` 때문에 `clarity meeting`이 된다는 표현이 나온다
- FounderMove는 growing companies에서 `priorities drift between meetings`, `progress becomes harder to measure`, founder가 execution의 invisible center가 된다고 설명한다

이 문제는 단순히 `회의가 길다`가 아니다.  
더 본질적으로는 `shared picture가 회의 밖에서 존재하지 않는다`는 뜻이다.

### 3.2. 상태가 여러 채널에 흩어져 있다

반복적으로 보인 조합은 아래다.

- Slack threads
- docs
- tickets
- meeting notes
- founder/리더 머릿속

문제는 팀이 게으르다는 것이 아니라, 실제 상태를 한 표면에서 볼 수 없다는 점이다.

Kris Licata의 6인 스타트업 사례도 비슷하다.

- `employees were busy, but not aligned`
- `the founder kept context in their heads`
- `updates happened in DMs`

업데이트는 많다.  
그러나 `무엇이 중요하고`, `무엇이 막혔고`, `누가 다음 owner인지`를 한 번에 보기 어렵다.

### 3.3. founder 또는 리더가 fallback integration layer가 된다

자료에서 반복된 표현:

- default approver
- one person holding too much context
- everything important still goes through you
- follow-through depends on one person chasing

이건 founder-led 팀의 전형적인 scaling pain다.  
초기에는 founder의 에너지와 shared memory로 굴러가지만, 일정 인원을 넘기면 그 방식이 조직 병목이 된다.

### 3.4. 바쁜데도 진척이 잘 안 느껴진다

반복된 표현:

- everyone is busy, but not aligned
- progress is hard to measure
- meetings feel busy but unclear
- conversations repeat
- decisions are made twice

즉 이 세그먼트의 핵심 pain는 생산성 일반론이 아니라 `바쁨과 진척 사이의 분리`다.

사람들은 열심히 움직이고 있지만, 리더는 무엇이 실제로 앞으로 갔는지 감각적으로만 안다.

### 3.5. owner와 due가 흐려져 결정이 다시 돌아온다

반복된 구조:

- 회의에서 뭔가 결정된다
- owner와 due가 분명하지 않다
- follow-up이 중간에 미끄러진다
- 결국 founder나 리더가 다시 챙긴다

이건 Dowin 관점에서 특히 중요하다.  
단순한 대시보드나 기록판으로는 부족하고, `누가 무엇을 이번 주에 붙잡고 있는가`가 함께 보이지 않으면 pain를 해결했다고 보기 어렵다.

## 4. 왜 이 문제가 중요한가

이 세그먼트에서 위 pain가 중요한 이유는 단순 불편이 아니라 `운영 통제력 손실`로 이어지기 때문이다.

### 4.1. 리더의 인지 부하가 커진다

상태가 분산되면 리더는 아래를 머리로 통합해야 한다.

- 지금 뭐가 중요한가
- 어디가 막혔는가
- 누가 owner인가
- 무엇을 내가 다시 물어봐야 하나

이 부담은 보통 시스템에 남지 않고 사람 머릿속에 남는다.

### 4.2. 팀이 founder energy에 의존하게 된다

shared picture가 약하면 팀은 시스템보다 founder의 질문과 energy를 기준으로 움직인다.

- founder가 물으면 움직인다
- founder가 바쁘면 흐려진다
- founder가 회의에서 정리해줘야 aligned된다

이건 scale의 반대 방향이다.

### 4.3. 회의 비용이 커진다

상태가 미리 보이지 않으면 회의에서 아래를 다시 한다.

- 무엇이 진행 중인지 설명
- 누가 owner인지 확인
- 막힘을 뒤늦게 발견
- 다음 액션을 다시 정리

그 결과 회의는 decision acceleration이 아니라 reconstruction 비용이 된다.

### 4.4. 문제 발견이 늦어진다

blocker, drift, follow-through failure를 회의에서야 발견하면 이미 개입 시점이 늦다.

즉 진짜 pain는 `정보가 없다`가 아니라 `너무 늦게 보인다`는 점이다.

## 5. Dowin가 줄 수 있는 잠재 가치

현재 가설 기준으로 Dowin가 이 세그먼트에 줄 수 있는 가치는 아래처럼 정리된다.

### 5.1. shared picture를 회의 밖에서 만든다

Dowin의 핵심 약속은 단순 기록 저장이 아니다.

- 이번 주 무엇이 중요한가
- 지금 어디가 흐려졌는가
- 누가 follow-up이 필요한가
- 무엇이 다음 액션인가

이걸 회의 전에 보이게 만드는 것이다.

### 5.2. 목표-실행-후속 확인을 한 흐름으로 묶는다

이 세그먼트의 현재 문제는 `정보는 있는데 연결이 끊긴다`는 데 있다.

Dowin는 다음을 하나의 운영 흐름으로 묶는 방향에 가깝다.

- 이번 주 핵심 목표
- 액션 아이템
- 실행 상태
- 개입 필요 지점
- 후속 확인

이 관점에서 Dowin의 경쟁 대상은 단순히 또 다른 task 입력 툴이 아니다.

- Slack을 대체하는 것이 아니다
- Notion을 없애는 것이 아니다
- 문서를 버리게 하는 것도 아니다

더 정확히는, 이미 여러 곳에 있는 상태를 `이번 주 누가 무엇을 끝내야 하는지` 기준으로 다시 보이게 만드는 운영 레이어에 가깝다.

### 5.3. founder dependency를 줄이는 운영 표면이 될 수 있다

지금 이 세그먼트는 founder가 context integrator 역할을 한다.

Dowin가 잘 작동한다면:

- founder가 직접 머리로 통합하던 상태를 표면화하고
- 회의 전에 current state를 보여주고
- follow-through가 흐려지는 지점을 빠르게 드러내서
- founder가 직접 다시 조립해야 하는 빈도를 줄일 수 있다

### 5.4. 이 제품은 generic PM tool이 아니라 운영 가시성 도구여야 한다

이 세그먼트에서 Dowin가 generic project tracker처럼 보이면 진다.

잠재 가치 문장은 아래처럼 가야 한다.

- 예쁜 정리 도구가 아니다
- task 입력 툴이 아니다
- 이번 주 shared picture를 늦지 않게 만드는 운영 도구다

## 현재 우선순위 해석

- 이 문서는 현재 Dowin ICP 가설 중 `1순위 검증 세그먼트`를 가장 길게 풀어쓴 문서다.
- 따라서 프랜차이즈 본사 운영팀 같은 다른 세그먼트보다 먼저 인터뷰와 문제 검증에 사용한다.
- 다만 이 문서만으로 ICP를 확정하지는 않는다.

## 6. 무엇이 아직 확정되지 않았는가

이 가설은 유력하지만, 아직 확정은 아니다.

아직 검증되지 않은 것은 아래다.

### 6.1. buyer가 founder인지 CoS/COO인지

문제를 느끼는 사람과 도입을 결정하는 사람이 같을 수도 있고 다를 수도 있다.

- founder가 가장 아파할 수 있다
- 하지만 실제 도입 champion은 COO나 Chief of Staff일 수 있다
- 현재 공개 자료 기준으로는 founder의 오른팔 역할을 하는 CoS / ops lead 쪽이 더 먼저 반응할 가능성이 높다

이 구분은 인터뷰로 확인해야 한다.

### 6.2. pain가 강해도 도구 도입 의지가 있는지

사람들은 pain를 느끼면서도 기존 방식에 적응해 버린다.

따라서 아래는 별도 검증이 필요하다.

- 이 pain를 새 도구로 풀고 싶어 하는가
- 아니면 사람 한 명 더 뽑는 걸 선호하는가
- Notion/Slack 안에서 해결하려 하는가

### 6.3. 현재 Dowin 제품 흐름이 바로 맞는지

문제는 선명해도, 현재 제품이 그 pain에 바로 들어가는지는 별도 문제다.

예를 들어 이 세그먼트가 기대하는 것은:

- blocker visibility
- owner/due clarity
- weekly priorities layer
- follow-through surfacing

현재 Dowin가 이 모든 기대에 이미 닫혀 있는 것은 아니다.

### 6.4. 세그먼트가 충분히 좁혀졌는지

`founder-led 소규모 팀`도 아직 넓다.

다음 단계에서는 더 좁혀야 한다.

- B2B SaaS 또는 운영 밀도가 높은 서비스 팀
- 운영/기획 혼합 팀
- COO/Chief of Staff 또는 그 대체 역할이 있는 팀
- weekly priorities를 이미 어느 정도 운영하는 팀

### 6.5. 명확히 덜 맞는 팀은 누구인가

현재 자료 기준으로 아래 세그먼트는 우선순위를 낮게 보는 편이 맞다.

- 1~4인 팀처럼 아직 shared picture 문제보다 개인 집중 문제가 더 큰 팀
- Jira/Linear/Asana가 이미 깊게 자리잡아 owner, due, blocker 가시성이 다른 도구에서 충분히 확보된 팀
- 주간 운영 cadence 자체가 아직 없어서 현재 pain가 `조립 비용`보다 `운영 습관 부재`에 더 가까운 팀

## 7. 다음 단계

이 문서 이후 해야 할 일은 기능 기획이 아니라 인터뷰 설계다.

### 7.1. 문제 문장 3개로 압축

현재 가장 강한 문제 문장 후보:

- 회의 전에 이번 주 상태를 다시 조립해야 하는 팀
- 우선순위와 follow-up이 Slack, 문서, 메모에 흩어져 대표가 직접 다시 chase하게 되는 팀
- 바쁜데도 shared picture가 늦게 만들어져 실제 진척이 흐릿한 팀

### 7.2. 인터뷰 질문 5~7개로 전환

예:

- 주간 회의 전에 상태를 다시 취합하는 일이 자주 있나요?
- 지금 shared picture는 어디에서 만들어지나요?
- 중요한 follow-up이 중간에 흐려지는 순간은 언제인가요?
- 대표나 리더가 직접 다시 물어봐야 하는 일이 반복되나요?
- owner와 due가 회의 뒤에 얼마나 또렷하게 남는 편인가요?

### 7.3. 세그먼트 접근 채널 정리

- founder / COO / Chief of Staff 네트워크
- LinkedIn
- startup/operator 커뮤니티
- 관련 채용공고와 공개 글에서 추가 pain language 수집

### 7.4. 인터뷰 후 판단 기준

인터뷰 뒤에는 아래를 본다.

- 같은 pain가 실제로 반복되는가
- buyer language가 선명한가
- 기존 대안의 한계가 분명한가
- Dowin가 들어갈 제품 표면이 보이는가

## 8. 결론

현재까지의 온라인 리서치 기준으로, Dowin의 가장 유력한 ICP 후보는 `대표가 직접 운영을 chase하는 founder-led 소규모 팀`이다.

그중에서도 더 구체적으로는 `Slack, Notion, Google Docs, 간단한 시트로 이미 운영은 돌아가지만, 주간 실행 상태를 한 번에 보기 어려워 founder나 founder의 오른팔이 계속 수동 통합자가 되는 팀`이 가장 가깝다.

실사용자 관점에서 가장 먼저 강한 아하 모먼트를 느낄 사람은 아래에 더 가깝다.

- 대표 본인
- Chief of Staff
- COO-lite
- ops lead

특히 `대표 대신 매주 상태를 다시 취합하고 owner/due/follow-up을 다시 세우는 사람`이 Dowin의 첫 챔피언일 가능성이 높다.

이 세그먼트에서 가장 반복되는 pain는 `일이 많다`가 아니다.  
더 본질적인 문제는 아래다.

- shared picture가 늦게 만들어진다
- follow-up이 흩어진다
- owner와 due가 흐려진다
- 회의가 상태 재구성 자리가 된다
- founder가 직접 integration layer가 된다

Dowin가 이 세그먼트에서 의미 있으려면 `기록 도구`보다 `이번 주 운영 상태를 보이게 하고 개입 지점을 빨리 드러내는 도구`로 읽혀야 한다.

같은 말로 바꾸면, Dowin는 `새 협업툴`보다 `이미 쓰는 툴 위에서 주간 실행 운영을 선명하게 만드는 레이어`로 이해될 때 가장 설득력이 생긴다.

다만 아직 이건 `강한 가설`이지 `확정된 ICP`는 아니다.  
다음 단계는 판매나 기능 추가가 아니라, 직접 인터뷰를 통해 이 pain가 진짜 반복되는지 확인하는 일이다.

## 참고 자료 (References)

- Reddit / r/startups
  - Founders: do daily standups actually scale once your team grows?
  - https://www.reddit.com/r/startups/comments/1rkaey0/founders_do_daily_standups_actually_scale_once/
- Reddit / r/startups
  - I spent a week talking to engineers and founders about standups. Here's what actually surprised me.
  - https://www.reddit.com/r/startups/comments/1rocb0n/i_spent_a_week_talking_to-engineers-and-founders/
- Chief of Staff Network
  - Beyond Excel: Building Operating Rhythm from Scratch
  - https://www.linkedin.com/posts/chiefofstaffnetwork_beyond-excel-building-operating-rhythm-from-activity-7407140038570024962-1qUE
- Chief of Staff Network
  - From Radar Jammer to Air-Traffic Controller
  - https://www.linkedin.com/posts/chiefofstaffnetwork_chiefofstaff-ai-operations-activity-7419098113287753728-pwEy
- Palette
  - Weekly Priorities
  - https://palette.team/docs/weekly-priorities-team-check-in
- Notion
  - Notion for Startups
  - https://www.notion.com/startups/slack
- Google Workspace
  - No-cost collaboration tools for teams
  - https://workspace.google.com/essentials/
- FounderMove
  - Leadership Execution Breaks Down Between Meetings
  - https://www.foundermove.com/blog-posts/leadership-execution-breaks-down-between-meetings
- Evoldera
  - Founder Cadence: Preventing Execution Drift as Companies Scale
  - https://evoldera.com/insights/founder-cadence/
- Founded Partners
  - Why Leadership Teams Drift Out of Alignment and How to Bring Them Back Together
  - https://www.foundedpartners.com/blog/leadership-teams-drift-bring-them-back-together
- Founded Partners
  - Why Capable Leadership Teams Stop Moving Together at Scale
  - https://www.foundedpartners.com/blog/why-teams-stop-moving-together
- Founded Partners
  - Operating cadence for founder led lower middle market companies
  - https://www.foundedpartners.com/founder-faqs/strategy-and-growth/operating-cadence
- Monkhouse & Company
  - Chief of Staff vs COO: 4 reasons a scale-up CEO needs a Chief of Staff first
  - https://www.monkhouseandcompany.com/resources/insight/4-reasons-why-successful-ceos-need-a-chief-of-staff-and-not-a-coo/
- founderled.io
  - Chief of Staff job posting
  - https://www.linkedin.com/jobs/view/chief-of-staff-at-founderled-io-4375085375
- Wave
  - The Founder’s Operating System
  - https://www.ourwave.io/the-garage/blog/the-founders-operating-system
- Wave
  - The Startup Execution Trap
  - https://www.ourwave.io/the-garage/blog/he-startup-execution-trap
- nat.io
  - Fractional CTO Office Hours: The Weekly Cadence That Prevents Founder Panic
  - https://nat.io/blog/fractional-cto-office-hours-weekly-cadence-prevents-founder-panic
- Kris Licata
  - How a six-person startup built flow, focus, and follow-through
  - https://krislicata.com/cos/rhythm-of-business-for-startups
