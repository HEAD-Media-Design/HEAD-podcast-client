import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Loads repo-root `.env` into `process.env` for keys that are not already set
 * (so Cloudflare / CI env vars win). Used by Node build scripts before Vite runs.
 */
export function applyRootDotEnv(repoRoot: string): void {
  const envFile = path.join(repoRoot, ".env");
  if (!existsSync(envFile)) return;
  for (const rawLine of readFileSync(envFile, "utf8").split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
