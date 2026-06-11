// Loads server/.env.local (KEY=VALUE lines) into process.env, no dependency.
// Import this FIRST: solana.ts reads SOLANA_RPC at module scope. Real env vars
// win over the file, so inline overrides (PORT=…, GATE_TOKENS=…) keep working.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !m[1].startsWith("#") && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2];
    }
  }
}
