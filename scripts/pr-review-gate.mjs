// PR 변경 파일 패턴을 보고 어떤 dowin-*-check 스킬/검증 명령이 필요한지 알려주는 순수 규칙 기반 스크립트.
// 외부 LLM 호출 없음, 자동 승인/차단 없음 — CI Job Summary 또는 로컬 터미널에 체크리스트만 출력한다.
// 근거: docs/planning/2026.07.13-ai-engineering-application-plan.md §4.5, §8.5(2번)
//
// 사용법:
//   node scripts/pr-review-gate.mjs                # git diff로 변경 파일 자동 계산 (origin/main 기준)
//   node scripts/pr-review-gate.mjs changed.txt     # 파일 목록(줄바꿈 구분)을 직접 전달
//   yarn review:gate

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

/**
 * 패턴은 `*`(경로 세그먼트 내부)와 `**`(임의 깊이)만 지원하는 최소 glob이다.
 * 새 외부 의존성(minimatch 등)을 추가하지 않기 위해 직접 정규식으로 변환한다.
 * 중간 placeholder 문자를 쓰지 않고 한 번의 replace 콜백으로 변환한다.
 */
function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/\*\*|\*/g, (match) =>
    match === "**" ? ".*" : "[^/]*",
  );
  return new RegExp(`^${pattern}$`);
}

// 이 목록의 patterns/checks는 각 dowin-*-check 스킬 SKILL.md 프론트매터의
// description(트리거 조건)을 手동으로 재인코딩한 것이다. 스킬 트리거 조건이
// 바뀌면 이 목록도 같이 갱신해야 한다 — 두 곳이 어긋나도 이 스크립트는
// 참고용 안내만 하므로 자동으로 잡히지 않는다.
const RULES = [
  {
    patterns: ["src/app/api/**", "src/domain/**"],
    checks: ["dowin-backend-quality-check", "dowin-backend-security-check"],
  },
  {
    patterns: ["src/api-spec/openapi.yaml"],
    checks: [
      "dowin-backend-quality-check",
      "dowin-frontend-quality-check",
      "yarn gen:api 재실행 여부 확인",
    ],
  },
  {
    patterns: ["src/lib/server/**"],
    checks: ["dowin-backend-quality-check", "dowin-backend-security-check"],
  },
  {
    patterns: ["src/app/**", "src/components/**", "src/hooks/**"],
    // src/app/api/** 는 위 backend 규칙에서 이미 처리한다 — 여기서 다시 잡히면
    // 백엔드 전용 PR에도 frontend-quality-check가 잘못 붙는다.
    excludePatterns: ["src/app/api/**"],
    checks: ["dowin-frontend-quality-check"],
  },
  {
    patterns: [
      "src/lib/bridge.ts",
      "src/types/bridge.ts",
      "docs/dev/app-webview/**",
    ],
    checks: ["dowin-frontend-webview", "dowin-frontend-security-check"],
  },
  {
    patterns: [
      ".agents/**",
      ".claude/skills/**",
      ".claude/settings.json",
      ".claude/settings.local.json",
      ".mcp.json",
      "AGENTS.md",
      "codex.md",
      "CLAUDE.md",
    ],
    checks: ["dowin-harness-security-check"],
  },
  {
    patterns: [
      "src/domain/**/storage/**",
      "src/domain/dashboard/**",
      "src/domain/scoreboard/**",
      "src/domain/analytics/**",
      "src/db/schema.ts",
    ],
    checks: ["dowin-backend-performance-check"],
  },
];

function getChangedFilesFromArg(path) {
  let content;
  try {
    content = readFileSync(path, "utf-8");
  } catch (error) {
    console.error(
      `[pr-review-gate] "${path}"를 읽을 수 없습니다 (${error.code ?? error.message}). ` +
        "변경된 파일이 없다고 가정하고 참고용 안내만 건너뜁니다.",
    );
    return [];
  }
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getChangedFilesFromGit() {
  const base = ["origin/main", "main"].find((ref) => {
    try {
      execFileSync("git", ["rev-parse", "--verify", ref], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  });
  if (!base) {
    console.error(
      "[pr-review-gate] origin/main도 로컬 main도 찾을 수 없습니다. " +
        "`node scripts/pr-review-gate.mjs <changed-files.txt>`처럼 파일 목록을 직접 전달하세요.",
    );
    return [];
  }
  const output = execFileSync(
    "git",
    ["diff", "--name-only", `${base}...HEAD`],
    { encoding: "utf-8" },
  );
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildReport(changedFiles) {
  const matchedByCheck = new Map();

  for (const file of changedFiles) {
    for (const rule of RULES) {
      const isMatch =
        rule.patterns.some((pattern) => globToRegExp(pattern).test(file)) &&
        !(rule.excludePatterns ?? []).some((pattern) =>
          globToRegExp(pattern).test(file),
        );
      if (!isMatch) continue;
      for (const check of rule.checks) {
        if (!matchedByCheck.has(check)) matchedByCheck.set(check, new Set());
        matchedByCheck.get(check).add(file);
      }
    }
  }

  const lines = ["## PR 리뷰 게이트 (자동 생성, 규칙 기반)", ""];

  if (changedFiles.length === 0) {
    lines.push("변경된 파일이 없습니다.");
    return lines.join("\n");
  }

  if (matchedByCheck.size === 0) {
    lines.push(
      "패턴에 매칭되는 민감 경로가 없습니다. 표준 `yarn lint`/`yarn tsc --noEmit`/`yarn test`만 확인하면 됩니다.",
    );
    return lines.join("\n");
  }

  lines.push(`총 ${changedFiles.length}개 파일 변경. 아래 체크가 필요합니다:`, "");
  for (const [check, files] of matchedByCheck) {
    lines.push(`- **${check}** — ${files.size}개 파일 (${[...files].slice(0, 3).join(", ")}${files.size > 3 ? " 외" : ""})`);
  }
  lines.push(
    "",
    "_이 체크리스트는 참고용입니다. 자동 승인/차단하지 않으며, 최종 판단은 사람과 각 스킬의 검증 절차가 담당합니다._",
  );
  return lines.join("\n");
}

function main() {
  const fileArg = process.argv[2];
  const changedFiles = fileArg
    ? getChangedFilesFromArg(fileArg)
    : getChangedFilesFromGit();
  console.log(buildReport(changedFiles));
}

main();
