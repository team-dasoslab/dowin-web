---
작성일시: YYYY-MM-DD HH:mm:ss
목적: 운영 사고의 영향, 원인, 대응, 검증, 후속 액션을 일관된 형식으로 기록한다.
---

# Incident Note Template

> 이 템플릿은 Google SRE, PagerDuty, Atlassian의 postmortem / post-incident review 구조를 Dowin 운영 규모에 맞게 줄인 것이다.  
> 원칙은 blameless, 사실 중심, 재발 방지 액션 중심이다.

## 1. Summary

- 무엇이 발생했는가:
- 어떤 사용자가 영향을 받았는가:
- 현재 상태:
- 한 줄 원인:
- 한 줄 대응:

## 2. Metadata

| 항목                   | 값                                          |
| ---------------------- | ------------------------------------------- |
| Date                   | YYYY-MM-DD                                  |
| Severity               | P1/P2/P3                                    |
| Status                 | Investigating/Mitigated/Resolved/Monitoring |
| Incident Commander     | TBD                                         |
| Ops Lead               | TBD                                         |
| Communications Lead    | TBD                                         |
| System                 | Cloudflare Workers / D1 / Next.js / 기타    |
| Primary area           | 예: Auth, Dashboard, Billing, D1 migration  |
| Related commits        | TBD                                         |
| Related deploy/version | TBD                                         |

## 3. Impact

- 사용자 영향:
- 기능 영향:
- 시작 시각:
- 종료 시각:
- 지속 시간:
- 영향 규모:
- 데이터 손상 여부:
- 우회 방법:

## 4. Detection

- 감지 경로:
  - 사용자 제보 / Workers Logs / smoke test / 알림 / 수동 확인
- 최초 감지 시각:
- 최초 확인한 증거:
- 관련 로그/대시보드 링크:

## 5. Timeline

| Time                 | Event                    | Evidence            |
| -------------------- | ------------------------ | ------------------- |
| YYYY-MM-DD HH:mm KST | 사고 시작 또는 최초 증상 | 링크 또는 로그      |
| YYYY-MM-DD HH:mm KST | 원인 후보 확인           | 링크 또는 로그      |
| YYYY-MM-DD HH:mm KST | 완화 조치 적용           | 커밋/배포/운영 조치 |
| YYYY-MM-DD HH:mm KST | 복구 확인                | smoke test/로그     |

## 6. Root Cause

### Direct Cause

- 직접적으로 장애를 만든 코드, 설정, 데이터, 외부 의존성:

### Contributing Factors

- 왜 사전에 잡히지 않았는가:
- 왜 영향이 커졌는가:
- 어떤 관측/테스트/문서가 부족했는가:

## 7. Resolution

- 적용한 코드 대응:
- 적용한 운영 대응:
- rollback 또는 restore 여부:
- rollback과 DB restore를 분리해서 판단한 근거:
- 배포/릴리즈 정보:

## 8. Verification

아래 중 해당하는 검증만 남긴다.

```bash
yarn test --run <changed-test-file>
yarn test:backend
yarn test:frontend
yarn tsc --noEmit
yarn lint
```

- 운영 smoke check:
- 로그 확인:
- 재발 여부 확인 기간:

## 9. Communication

- 내부 공유:
- 사용자 공지 필요 여부:
- 사용자 공지 초안:

```text
현재 일부 사용자가 <영향 기능>에서 <증상>을 겪을 수 있습니다.
원인은 <요약>으로 확인했으며, <대응 상태>입니다.
추가 확인 후 다시 안내하겠습니다.
```

## 10. What Went Well

- 잘 작동한 대응:
- 도움이 된 로그/문서/테스트:

## 11. What Went Wrong

- 늦게 확인한 것:
- 부족했던 검증:
- 불명확했던 운영 판단:

## 12. Where We Got Lucky

- 더 커질 수 있었지만 커지지 않은 영향:
- 우연히 피해를 줄인 조건:

## 13. Tradeoffs

- 빠른 복구를 위해 감수한 것:
- 정확도, 성능, 운영 복잡도 사이의 선택:
- 나중에 다시 결정해야 할 것:

## 14. Follow-up Actions

| Action | Owner | Priority | Due        | Status | Tracking |
| ------ | ----- | -------- | ---------- | ------ | -------- |
| TBD    | TBD   | P1/P2/P3 | YYYY-MM-DD | Open   | Issue/PR |

## 15. Recurrence Runbook

같은 증상이 다시 나오면 아래 순서로 본다.

1. 최근 배포 여부:
2. 영향 경로:
3. 플랫폼 장애 여부:
4. 데이터 손상 여부:
5. rollback 필요 여부:
6. DB restore 필요 여부:
7. smoke check:
8. 사용자 공지:

## 16. References

- 관련 runbook:
- 관련 planning 문서:
- 관련 PR/commit:
- 템플릿 기준 참고:
  - Google SRE Postmortem Culture: https://sre.google/workbook/postmortem-culture/
  - PagerDuty Postmortem Template: https://response.pagerduty.com/after/post_mortem_template/
  - Atlassian Incident Postmortem Process: https://www.atlassian.com/incident-management/postmortem/templates
