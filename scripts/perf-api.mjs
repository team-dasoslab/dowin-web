import { spawn } from "node:child_process";

const DEFAULT_BASE_URL = "http://localhost:4000";
const DEFAULT_DURATION = "10";
const DEFAULT_CONNECTIONS = "10";

const PRESETS = {
  "users-me": {
    path: "/api/users/me",
    requiredEnv: ["DOWIN_COOKIE"],
    headers: () => ({
      Cookie: `dowin_sid=${process.env.DOWIN_COOKIE}`,
    }),
  },
  "workspace-detail": {
    path: `/api/workspaces/${process.env.DOWIN_WORKSPACE_ID ?? ":workspaceId"}`,
    requiredEnv: ["DOWIN_COOKIE", "DOWIN_WORKSPACE_ID"],
    headers: () => ({
      Cookie: `dowin_sid=${process.env.DOWIN_COOKIE}`,
    }),
  },
  "push-weekly-focus": {
    path: "/api/push/send-weekly-focus",
    requiredEnv: ["DOWIN_CRON_SECRET"],
    headers: () => ({
      Authorization: `Bearer ${process.env.DOWIN_CRON_SECRET}`,
    }),
  },
};

const DEFAULT_PRESET_SEQUENCE = [
  "users-me",
  "workspace-detail",
  "push-weekly-focus",
];

function printUsage() {
  console.log(`Usage:
  yarn perf:api [preset]

Presets:
  all                run the default slow-route bundle
  users-me           GET /api/users/me               requires DOWIN_COOKIE
  workspace-detail   GET /api/workspaces/:id         requires DOWIN_COOKIE, DOWIN_WORKSPACE_ID
  push-weekly-focus  GET /api/push/send-weekly-focus requires DOWIN_CRON_SECRET

Optional env:
  BASE_URL           default ${DEFAULT_BASE_URL}
  PERF_DURATION      default ${DEFAULT_DURATION}
  PERF_CONNECTIONS   default ${DEFAULT_CONNECTIONS}
`);
}

function runPreset(presetName) {
  const preset = PRESETS[presetName];
  const missingEnv = preset.requiredEnv.filter((name) => !process.env[name]);

  if (missingEnv.length > 0) {
    console.error(
      `[${presetName}] Missing required env: ${missingEnv.join(", ")}\n` +
        "Set them before running the perf script.",
    );
    return Promise.resolve(1);
  }

  const baseUrl = process.env.BASE_URL ?? DEFAULT_BASE_URL;
  const duration = process.env.PERF_DURATION ?? DEFAULT_DURATION;
  const connections = process.env.PERF_CONNECTIONS ?? DEFAULT_CONNECTIONS;
  const url = new URL(preset.path, baseUrl).toString();

  const args = ["dlx", "autocannon", "-d", duration, "-c", connections];

  for (const [key, value] of Object.entries(preset.headers())) {
    args.push("-H", `${key}: ${value}`);
  }

  args.push(url);

  console.log(
    [
      `Running autocannon preset=${presetName}`,
      `url=${url}`,
      `duration=${duration}s`,
      `connections=${connections}`,
    ].join(" "),
  );

  return new Promise((resolve) => {
    const child = spawn("yarn", args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

const presetName = process.argv[2] ?? "all";

if (presetName !== "all" && !(presetName in PRESETS)) {
  printUsage();
  process.exitCode = 1;
} else {
  const targets =
    presetName === "all" ? DEFAULT_PRESET_SEQUENCE : [presetName];

  for (const target of targets) {
    const exitCode = await runPreset(target);

    if (exitCode !== 0) {
      process.exitCode = exitCode;
      break;
    }
  }
}
