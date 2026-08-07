/**
 * Runtime environment lookup for server-only code.
 *
 * Different deploy targets expose variables differently:
 *  - Node / Vercel serverless: `process.env`
 *  - Edge / Workers (unenv): `globalThis.process.env`, sometimes an injected
 *    `globalThis.__env__` or a Cloudflare-style binding on `globalThis`
 * Reading through every source keeps one code path working everywhere.
 */

type EnvRecord = Record<string, string | undefined>;

function sources(): EnvRecord[] {
  const g = globalThis as unknown as {
    process?: { env?: EnvRecord };
    __env__?: EnvRecord;
    env?: EnvRecord;
  };
  const list: EnvRecord[] = [];
  if (typeof process !== "undefined" && process.env) list.push(process.env as EnvRecord);
  if (g.process?.env) list.push(g.process.env);
  if (g.__env__) list.push(g.__env__);
  if (g.env && typeof g.env === "object") list.push(g.env);
  return list;
}

/** Returns the first non-empty value found for `name` across runtime sources. */
export function readServerEnv(name: string): string | undefined {
  for (const source of sources()) {
    const value = source[name];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return undefined;
}

/** Diagnostic only: which source (if any) holds `name`. Never returns the value. */
export function describeServerEnv(name: string): {
  present: boolean;
  source: string | null;
  visibleKeyCount: number;
} {
  const labels = ["process.env", "globalThis.process.env", "globalThis.__env__", "globalThis.env"];
  const list = sources();
  let source: string | null = null;
  for (let i = 0; i < list.length; i++) {
    const value = list[i]?.[name];
    if (typeof value === "string" && value.trim() !== "") {
      source = labels[i] ?? "unknown";
      break;
    }
  }
  const keys = new Set<string>();
  for (const s of list) for (const k of Object.keys(s)) keys.add(k);
  return { present: source !== null, source, visibleKeyCount: keys.size };
}
