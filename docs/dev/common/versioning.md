# 프로젝트 버전 및 릴리스 가이드

우리 프로젝트는 **Conventional Commits**와 **Release Please**를 사용하여 Changelog 생성 및 버전 관리를 자동화합니다.

## Conventional Commits 규칙

커밋 메시지는 다음 형식을 따라야 합니다. `commitlint`와 `husky`가 적용되어 있어 규칙에 어긋나는 커밋은 차단됩니다.

```
<type>(<scope>): <description>
```

### Type의 종류와 버전 범프 영향

| Type             | 설명                               | 버전 범프       | 예시                                    |
| ---------------- | ---------------------------------- | --------------- | --------------------------------------- |
| `feat`           | 새로운 기능 추가                   | Minor (`0.1.0`) | `feat(auth): 소셜 로그인 추가`          |
| `fix`            | 버그 수정                          | Patch (`0.0.1`) | `fix(dashboard): 차트 렌더링 오류 수정` |
| `feat!` / `fix!` | 하위 호환성 깨짐 (Breaking Change) | Major (`1.0.0`) | `feat!(api): API v2 마이그레이션`       |
| `chore`          | 빌드, 패키지 매니저 설정 등        | 없음            | `chore(deps): Next.js 업데이트`         |
| `docs`           | 문서 작성 및 수정                  | 없음            | `docs: README 수정`                     |
| `refactor`       | 코드 리팩토링                      | 없음            | `refactor: 버튼 컴포넌트 구조 변경`     |
| `test`           | 테스트 코드 추가/수정              | 없음            | `test: 로그인 테스트 추가`              |
| `style`          | 코드 포맷팅 (로직 변경 없음)       | 없음            | `style: 린트 에러 수정`                 |

## 릴리스 워크플로우

1. **개발 진행**:
   기능 개발이나 버그 수정을 마치고 `main` 브랜치로 병합(Merge)합니다. 이 때 모든 커밋은 Conventional Commits 형식을 준수해야 합니다.
2. **Release PR 자동 생성**:
   `main` 브랜치에 코드가 푸시되면, GitHub Action(Release Please)이 자동으로 동작하여 **Release PR**을 생성합니다. (예: `chore(release): release v1.3.0`)
   - 이 PR에는 자동으로 작성된 `CHANGELOG.md` 초안과 `package.json`의 버전 범프 내역이 포함되어 있습니다.
   - 새로운 기능이 `main`에 추가될 때마다 이 PR이 자동으로 업데이트됩니다.
3. **버전 확정 및 릴리스 (main)**:
   배포 준비가 완료되면, 관리자가 해당 "Release PR"을 승인하고 `main` 브랜치에 병합합니다.
   - 병합과 동시에 Action이 자동으로 GitHub Release를 발행하고 `v1.x.x` 태그를 생성합니다.
4. **프로덕션 배포 트리거**:
   이후 개발자가 수동으로 `main`을 `production` 브랜치에 병합하는 PR을 열어 병합합니다.
   - `production`에 코드가 들어가면 기존에 설정된 배포 파이프라인이 구동되어 프로덕션 환경에 배포가 완료됩니다.
