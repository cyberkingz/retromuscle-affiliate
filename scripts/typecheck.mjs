import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

// `tsc --noEmit` can fail if `.next/types` exists but is stale (typedRoutes generates
// reference files that expect all route type stubs to be present). We remove it to
// make `npm run typecheck` deterministic; `next build` remains the source of truth.
const nextTypesDir = path.join(process.cwd(), ".next", "types");
try {
  fs.rmSync(nextTypesDir, { recursive: true, force: true });
} catch {
  // ignore
}

const tscBin = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsc.cmd" : "tsc"
);

const result = spawnSync(tscBin, ["--noEmit"], { stdio: "inherit" });
process.exitCode = result.status ?? 1;

