---
description: 백엔드 TDD(테스트 주도 개발) 개발 프로세스 — 테스트 작성 → 구현 → 품질 검증 3단계
---

# 백엔드 TDD 개발 워크플로우

이 워크플로우는 WIG 백엔드(API 라우트, 비즈니스 로직) 개발 시 적용한다.  
**프론트엔드에는 적용하지 않는다.** 품질 기준은 `docs/dev/2026.03.12-quality-strategy.md`를 따른다.

---

## 핵심 원칙

1. **Red → Green → Refactor**: 실패하는 테스트를 먼저 작성하고, 통과하도록 구현한 뒤 리팩터링한다.
2. **테스트는 명세(Spec)다**: 테스트 코드는 도메인 설계 문서(`docs/dev/`)의 Business Rules를 코드로 표현한 것이다.
3. **서버 검증 우선**: 클라이언트 유효성 검사와 관계없이 API 레벨에서 모든 규칙을 독립적으로 검증한다.
4. **Prepared Statement 필수**: DB 쿼리는 반드시 파라미터 바인딩을 사용한다. 문자열 포맷팅으로 SQL 쿼리를 생성하지 않는다.
5. **표준 응답 객체 준수**: API 라우트의 모든 응답(성공/에러)과 에러 처리(`throw new BadRequestError()`)는 `docs/dev/2026.03.12-api-conventions.md`에 정의된 규격을 반드시 따른다.

---

## Phase 1: 테스트 코드 작성 (Red)

> **작업 시작 전에 반드시 이 단계를 먼저 완료한다.**

1. 해당 도메인의 설계 문서(`docs/dev/2026.03.12-domain-*.md`)를 열어 **Business Rules** 및 **Error Cases**를 확인한다.

2. `docs/dev/2026.03.12-quality-strategy.md`의 **도메인별 핵심 테스트 케이스** 항목을 체크한다.

3. 테스트 파일을 구현 파일과 같은 경로에 `.test.ts` 확장자로 생성한다.
   ```
   src/
     api/auth/
       login.ts          ← 구현 (아직 없음 또는 빈 stub)
       login.test.ts     ← 테스트 먼저 작성
   ```

4. 단위 테스트(비즈니스 로직 함수)와 통합 테스트(API 엔드포인트)를 분리하여 작성한다.
   ```typescript
   // ✅ 단위 테스트 예시 — 순수 함수 테스트
   describe('validatePassword', () => {
     it('8자 미만은 거부한다', () => {
       expect(validatePassword('short')).toBe(false);
     });
     it("금지 문자(') 포함 시 거부한다", () => {
       expect(validatePassword("pass'word")).toBe(false);
     });
     it('유효한 비밀번호는 통과한다', () => {
       expect(validatePassword('validPass1!')).toBe(true);
     });
   });

   // ✅ 통합 테스트 예시 — API 엔드포인트 테스트
   describe('POST /api/auth/login', () => {
     it('유효한 ID/PW로 로그인 시 JWT를 발급한다', async () => { ... });
     it('잘못된 PW로 로그인 시 401을 반환한다', async () => { ... });
     it('ID/PW 중 어느 쪽이 틀렸는지 응답에 노출하지 않는다', async () => { ... });
   });
   ```

5. 테스트를 실행하여 **Red(실패) 상태를 확인**한다.
   ```bash
   yarn test --run src/api/auth/login.test.ts
   ```

---

## Phase 2: 구현 (Green)

> Phase 1의 테스트를 통과시키는 **최소한의 코드**만 작성한다.

1. 구현 파일에 실제 로직을 작성한다. 이 때 다음 사항을 준수한다.
   - 비즈니스 규칙은 **도메인 설계 문서**에 정의된 규칙과 정확히 일치해야 한다.
   - DB 쿼리는 반드시 Prepared Statement (D1 바인딩) 사용.
   - ID/PW 유효성 검사는 `docs/dev/2026.03.12-domain-auth.md` 섹션 2-1의 정규식을 사용한다.

2. 테스트를 다시 실행하여 **Green(통과) 상태를 확인**한다.
   ```bash
   yarn test --run src/api/auth/login.test.ts
   ```

3. 모든 테스트가 통과하면 리팩터링(코드 정리)을 진행한다. 리팩터링 후에도 테스트가 통과해야 한다.

---

## Phase 3: 품질 검증 (Verify)

> 작업한 도메인의 **전체 테스트 스위트**를 실행하고 품질 게이트를 통과한다.

1. **전체 테스트 실행**
   ```bash
   yarn test
   ```

2. **품질 게이트 확인** (`docs/dev/2026.03.12-quality-strategy.md` 섹션 7 기준)

   | 게이트 | 기준 | 확인 |
   |--------|------|------|
   | 단위 테스트 통과율 | 100% | [ ] |
   | 핵심 도메인 커버리지 | ≥ 80% | [ ] |
   | 통합 테스트 (Happy Path) | 100% 통과 | [ ] |
   | TypeScript 컴파일 오류 | 0건 | [ ] |
   | ESLint 오류 | 0건 | [ ] |

3. **TypeScript 타입 검사**
   ```bash
   yarn tsc --noEmit
   ```

4. **린트 검사**
   ```bash
   yarn lint
   ```

5. 보안 검증 체크 (`docs/dev/2026.03.12-quality-strategy.md` 섹션 6.1):
   - [ ] 타인의 리소스 접근 시 403 반환 확인 (소유권 검증 테스트 포함)
   - [ ] ADMIN 전용 API에 MEMBER 접근 시 403 반환 확인
   - [ ] 모든 DB 쿼리에 Prepared Statement 사용 확인

6. 모든 게이트 통과 시 작업 완료로 간주한다.

---

## 체크리스트 요약

```
[ ] Phase 1: 도메인 설계 문서 확인
[ ] Phase 1: 테스트 파일 생성 및 실패 케이스 작성 (Red 확인)
[ ] Phase 2: 최소 구현 코드 작성 (Green 확인)
[ ] Phase 2: 리팩터링 (테스트 재통과 확인)
[ ] Phase 3: 전체 테스트 스위트 통과
[ ] Phase 3: TypeScript 컴파일 오류 0건
[ ] Phase 3: ESLint 오류 0건
[ ] Phase 3: 보안 검증 체크리스트 완료
```
