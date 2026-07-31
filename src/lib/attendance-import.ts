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

/** Merge keeps the highest counts per subject and unions new subjects. */
export function mergeSubjects(existing: Subject[], incoming: Subject[]): Subject[] {
  const map = new Map(existing.map((s) => [s.code, { ...s }]));
  for (const next of incoming) {
    const prev = map.get(next.code);
    if (!prev) {
      map.set(next.code, { ...next });
      continue;
    }
    map.set(next.code, {
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

export const pct = (s: Subject) => (s.total > 0 ? Math.round((s.present / s.total) * 100) : 0);
