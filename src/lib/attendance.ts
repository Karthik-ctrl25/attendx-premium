import type { HistoryEntry, Subject } from "./types";

export const THRESHOLDS = [75, 80, 85, 90] as const;

export function percent(present: number, total: number) {
  if (!total) return 0;
  return (present / total) * 100;
}

export function statusOf(pct: number, total: number): "good" | "warn" | "bad" | "none" {
  if (!total) return "none";
  if (pct >= 85) return "good";
  if (pct >= 75) return "warn";
  return "bad";
}

export const STATUS_COLOR: Record<string, string> = {
  good: "var(--good)",
  warn: "var(--warn)",
  bad: "var(--bad)",
  none: "var(--primary)",
};

export const STATUS_TEXT: Record<string, string> = {
  good: "text-good",
  warn: "text-warn",
  bad: "text-bad",
  none: "text-muted-foreground",
};

/** Consecutive classes to attend to reach `target` percent. */
export function classesNeeded(present: number, total: number, target: number) {
  const t = target / 100;
  if (total > 0 && present / total >= t) return 0;
  if (t >= 1) return Infinity;
  const need = Math.ceil((t * total - present) / (1 - t));
  return Math.max(0, need);
}

/** Consecutive classes that can be missed while staying at/above `target`. */
export function classesCanMiss(present: number, total: number, target: number) {
  const t = target / 100;
  if (!total || present / total < t) return 0;
  return Math.max(0, Math.floor(present / t - total));
}

export function overallStats(subjects: Subject[]) {
  const present = subjects.reduce((a, s) => a + s.present, 0);
  const absent = subjects.reduce((a, s) => a + s.absent, 0);
  const total = subjects.reduce((a, s) => a + s.total, 0);
  return { present, absent, total, pct: percent(present, total) };
}

export function bestAndWorst(subjects: Subject[]) {
  const active = subjects.filter((s) => s.total > 0);
  if (!active.length) return { best: null, worst: null };
  const sorted = [...active].sort(
    (a, b) => percent(b.present, b.total) - percent(a.present, a.total),
  );
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

/** Rolling overall attendance percentage over the last `days` days of history. */
export function trendSeries(history: HistoryEntry[], days = 14) {
  const live = history.filter((h) => !h.undone).sort((a, b) => a.ts - b.ts);
  const out: { label: string; pct: number }[] = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let present = 0;
  let total = 0;
  let cursor = 0;

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const end = day.getTime();
    while (cursor < live.length && live[cursor].ts <= end) {
      if (live[cursor].action === "present") present++;
      total++;
      cursor++;
    }
    out.push({
      label: day.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      pct: total ? Math.round(percent(present, total)) : 0,
    });
  }
  return out;
}
