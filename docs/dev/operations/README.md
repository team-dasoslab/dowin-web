# DOWIN Operations Docs

최종 확인일: 2026-04-19

이 폴더는 DOWIN 운영 준비와 장애 대응에 직접 쓰는 문서를 모아둔 곳이다.  
`common`이 공통 설계/규약 문서라면, `operations`는 실제 운영 사고에서 바로 펼쳐보는 실행 문서에 가깝다.

## 1. 먼저 볼 문서

1. [운영 사고 대응 준비 계획](/docs/planning/2026.04.19-production-incident-readiness-plan.md)
2. [Audit Log / Soft Delete 도입 계획](/docs/planning/2026.04.20-audit-log-soft-delete-plan.md)
3. [Audit Logs MVP Schema Plan](/docs/planning/2026.04.20-audit-logs-mvp-schema-plan.md)
4. [DB Restore Runbook](/docs/dev/operations/2026.04.19-db-restore-runbook.md)
5. [Deployment Rollback Runbook](/docs/dev/operations/2026.04.19-deployment-rollback-runbook.md)
6. [Production Deployment Flow](/docs/dev/common/2026.04.19-production-deployment-flow.md)
7. [Incident Communication Template](/docs/dev/operations/2026.04.19-incident-communication-template.md)
8. [Partial Data Recovery Guide](/docs/dev/operations/2026.04.20-partial-data-recovery-guide.md)
9. [Admin User Bootstrap Runbook](/docs/dev/operations/2026.05.01-admin-user-bootstrap-runbook.md)

## 2. 문서 역할

- [2026.04.19-db-restore-runbook.md](/docs/dev/operations/2026.04.19-db-restore-runbook.md)
  - D1 데이터 손실 또는 심각한 데이터 손상 시 restore 판단과 실행 절차
- [2026.04.19-deployment-rollback-runbook.md](/docs/dev/operations/2026.04.19-deployment-rollback-runbook.md)
  - 최근 배포로 서비스가 깨졌을 때 Worker rollback 판단과 실행 절차
- [2026.04.19-production-deployment-flow.md](/docs/dev/common/2026.04.19-production-deployment-flow.md)
  - `production` 브랜치 배포 이유, Cloudflare Git integration, GitHub Actions D1 migration 구성
- [2026.04.19-incident-communication-template.md](/docs/dev/operations/2026.04.19-incident-communication-template.md)
  - 내부 공유, 외부 공지, 복구 공지, 사후 공유 템플릿
- [2026.04.20-partial-data-recovery-guide.md](/docs/dev/operations/2026.04.20-partial-data-recovery-guide.md)
  - 시점 A~B 사이 신규 데이터를 보존하면서 손실 데이터만 선별 복구하는 전략과 사전 준비 항목
- [2026.05.01-admin-user-bootstrap-runbook.md](/docs/dev/operations/2026.05.01-admin-user-bootstrap-runbook.md)
  - 운영 콘솔 첫 계정을 로컬 D1에 수동 bootstrap하는 절차

## 3. 운영 중 기본 원칙

- 코드 rollback과 DB restore는 별도 판단이다.
- 사고 중에는 추가 배포와 추가 migration을 먼저 멈춘다.
- Cloudflare 장애 가능성을 항상 같이 본다.
- 복구 전에는 짧고 자주 공지하고, 복구 후에는 postmortem을 남긴다.

## 4. 다음에 추가할 문서

- release smoke checklist
- incident severity guide
- postmortem template
