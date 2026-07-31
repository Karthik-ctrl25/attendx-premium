import type { AttendanceImport, Subject } from "./types";

/** SHA-256 of the raw file bytes — identifies the exact same screenshot. */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return digest(buffer);
}

/** Stable signature of the extracted numbers — identifies the same data. */
export async function hashSubjects(subjects: Subject[]): Promise<string> {
  const signature = [...subjects]
    .map((s) => `${s.code}:${s.present}:${s.absent}:${s.total}`)
    .sort()
    .join("|");
  return digest(new TextEncoder().encode(signature));
}

async function digest(data: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const out = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
    return [...new Uint8Array(out)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Deterministic fallback for environments without WebCrypto.
  let h = 2166136261;
  for (const b of bytes) h = Math.imul(h ^ b, 16777619);
  return (h >>> 0).toString(16);
}

export type DuplicateKind = "file" | "data";

export function findDuplicate(
  imports: AttendanceImport[],
  fileHash: string,
  dataHash: string,
): { entry: AttendanceImport; kind: DuplicateKind } | null {
  const byFile = imports.find((i) => i.fileHash === fileHash);
  if (byFile) return { entry: byFile, kind: "file" };
  const byData = imports.find((i) => i.dataHash === dataHash);
  if (byData) return { entry: byData, kind: "data" };
  return null;
}

/** Codes are the identity of a subject — normalise before matching. */
export const normalizeCode = (code: string) => code.replace(/[\s.-]/g, "").toUpperCase();

/**
 * Merge keeps the highest counts per subject and unions new subjects.
 * Matching is by normalised course code, so duplicates are never created.
 */
export function mergeSubjects(existing: Subject[], incoming: Subject[]): Subject[] {
  const map = new Map(existing.map((s) => [normalizeCode(s.code), { ...s }]));
  for (const next of incoming) {
    const key = normalizeCode(next.code);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...next });
      continue;
    }
    map.set(key, {
      ...prev,
      name: next.name || prev.name,
      faculty: next.faculty || prev.faculty,
      present: Math.max(prev.present, next.present),
      absent: Math.max(prev.absent, next.absent),
      total: Math.max(prev.total, next.total, next.present + next.absent),
    });
  }
  return [...map.values()];
}

/** Replace overwrites matched subjects with ERP values, keeping unmatched ones. */
export function replaceSubjects(existing: Subject[], incoming: Subject[]): Subject[] {
  const map = new Map(existing.map((s) => [normalizeCode(s.code), { ...s }]));
  for (const next of incoming) {
    map.set(normalizeCode(next.code), { ...next, flagged: false, flagReason: undefined });
  }
  return [...map.values()];
}

export type DiffKind = "same" | "changed" | "new" | "missing";

export interface SubjectDiff {
  code: string;
  name: string;
  kind: DiffKind;
  stored?: Subject;
  erp?: Subject;
  /** ERP total minus stored total (positive = ERP is ahead). */
  delta: number;
}

/** Compares stored attendance against a fresh ERP import, row by row. */
export function diffSubjects(stored: Subject[], erp: Subject[]): SubjectDiff[] {
  const storedMap = new Map(stored.map((s) => [normalizeCode(s.code), s]));
  const erpMap = new Map(erp.map((s) => [normalizeCode(s.code), s]));
  const keys = [...new Set([...storedMap.keys(), ...erpMap.keys()])];

  return keys
    .map<SubjectDiff>((key) => {
      const a = storedMap.get(key);
      const b = erpMap.get(key);
      const name = b?.name || a?.name || key;
      const code = b?.code || a?.code || key;
      if (a && !b) return { code, name, kind: "missing", stored: a, delta: 0 };
      if (!a && b) return { code, name, kind: "new", erp: b, delta: b.total };
      const same =
        a!.present === b!.present && a!.absent === b!.absent && a!.total === b!.total;
      return {
        code,
        name,
        kind: same ? "same" : "changed",
        stored: a,
        erp: b,
        delta: (b!.total ?? 0) - (a!.total ?? 0),
      };
    })
    .sort((x, y) => {
      const order: Record<DiffKind, number> = { changed: 0, new: 1, missing: 2, same: 3 };
      return order[x.kind] - order[y.kind] || x.code.localeCompare(y.code);
    });
}

export const pct = (s: Subject) => (s.total > 0 ? Math.round((s.present / s.total) * 100) : 0);

