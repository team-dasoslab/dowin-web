import path from "node:path";

type PerfTraceStep = {
  step: string;
  durationMs: number;
};

type PerfTracePayload = {
  at: string;
  label: string;
  totalMs: number;
  steps: PerfTraceStep[];
} & Record<string, unknown>;

export class PerfTrace {
  private readonly enabled: boolean;
  private readonly logFilePath: string | null;
  private readonly startedAt: number;
  private lastMarkAt: number;
  private readonly steps: PerfTraceStep[] = [];

  constructor(
    private readonly label: string,
    options?: {
      enabled?: boolean;
    },
  ) {
    this.enabled = options?.enabled ?? process.env.NODE_ENV !== "production";
    this.logFilePath = this.enabled
      ? resolvePerfLogFilePath(process.env.DOWIN_PERF_LOG_FILE)
      : null;
    this.startedAt = performance.now();
    this.lastMarkAt = this.startedAt;
  }

  mark(step: string) {
    if (!this.enabled) {
      return;
    }

    const now = performance.now();
    this.steps.push({
      step,
      durationMs: roundMs(now - this.lastMarkAt),
    });
    this.lastMarkAt = now;
  }

  flush(extra?: Record<string, unknown>) {
    if (!this.enabled) {
      return;
    }

    const payload: PerfTracePayload = {
      at: new Date().toISOString(),
      label: this.label,
      totalMs: roundMs(performance.now() - this.startedAt),
      steps: this.steps,
      ...extra,
    };

    console.info(`[perf] ${this.label}`, payload);
    void appendPerfLog(this.logFilePath, payload);
  }
}

function roundMs(value: number) {
  return Math.round(value * 100) / 100;
}

function resolvePerfLogFilePath(customPath?: string) {
  if (customPath === "") {
    return null;
  }

  const filePath = customPath || "tmp/perf-api.ndjson";
  return path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
}

async function appendPerfLog(
  filePath: string | null,
  payload: PerfTracePayload,
) {
  if (!filePath) {
    return;
  }

  try {
    const fs = await import("node:fs/promises");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
  } catch (error) {
    console.warn("[perf] failed to append perf log", {
      filePath,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
