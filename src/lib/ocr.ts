/**
 * OCR pipeline tuned for CMR University ERP screenshots.
 *
 * Everything runs client-side with tesseract.js (loaded lazily so the SSR
 * bundle stays clean). Parsers are intentionally forgiving — the UI always
 * shows an editable preview before anything is saved.
 */
import type { ClassSlot, SessionType, Subject } from "./types";

export type OcrProgress = (stage: string, pct: number) => void;

export async function readImageText(file: File, onProgress?: OcrProgress): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) =>
      onProgress?.(m.status, Math.round((m.progress ?? 0) * 100)),
  });
  try {
    const url = URL.createObjectURL(file);
    const { data } = await worker.recognize(url);
    URL.revokeObjectURL(url);
    return data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

/**
 * Same as `readImageText` but also reports the OCR confidence (0-100) so the
 * UI can warn when a screenshot was read poorly.
 */
export async function readImage(
  file: File,
  onProgress?: OcrProgress,
): Promise<{ text: string; confidence: number }> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) =>
      onProgress?.(m.status, Math.round((m.progress ?? 0) * 100)),
  });
  try {
    const url = URL.createObjectURL(file);
    const { data } = await worker.recognize(url);
    URL.revokeObjectURL(url);
    return { text: data.text ?? "", confidence: Math.round(data.confidence ?? 0) };
  } finally {
    await worker.terminate();
  }
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const COURSE_CODE = /\b([A-Z]{2,4}\s?\d{2,3}[A-Z]?\d{0,3}[A-Z]?)\b/;
const TIME_RANGE =
  /(\d{1,2})[:.](\d{2})\s*(AM|PM)?\s*(?:-|–|—|to)\s*(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i;

const DAY_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

function cleanLine(line: string) {
  return line
    .replace(/[|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function to24h(h: number, m: number, mer?: string) {
  let hour = h;
  const meridiem = mer?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (!meridiem && hour < 8) hour += 12; // ERP often prints 1:30 for 13:30
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function detectDay(line: string): number | null {
  const lower = line.toLowerCase();
  for (const key of Object.keys(DAY_MAP)) {
    if (new RegExp(`\\b${key}\\b`).test(lower)) return DAY_MAP[key];
  }
  const dmy = lower.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    const date = new Date(year, Number(dmy[2]) - 1, Number(dmy[1]));
    if (!Number.isNaN(date.getTime())) return date.getDay();
  }
  return null;
}

function detectRoom(line: string): string {
  const m =
    line.match(/\b(?:room|rm|hall|lab|block)\s*[:\-]?\s*([A-Z]?-?\d{1,4}[A-Z]?)\b/i) ??
    line.match(/\b([A-Z]{1,2}-\d{2,4})\b/) ??
    line.match(/\b(\d{3,4}[A-Z]?)\b(?!\s*[%])/);
  return m ? m[1].toUpperCase() : "";
}

function detectSession(line: string): SessionType {
  return /\b(lab|practical|prac)\b/i.test(line) ? "Lab" : "Theory";
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractFaculty(segments: string[]): string {
  const candidate = segments.find((s) => /(dr|prof|mr|ms|mrs)\.?\s+[a-z]/i.test(s));
  if (candidate) return titleCase(candidate.replace(/[^A-Za-z. ]/g, "").trim());
  const wordy = segments.find((s) => /^[A-Za-z. ]{6,40}$/.test(s.trim()) && s.trim().includes(" "));
  return wordy ? titleCase(wordy.trim()) : "";
}

let seq = 0;
function uid(prefix: string) {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq}`;
}

/* ------------------------------------------------------------------ */
/* schedule parser                                                     */
/* ------------------------------------------------------------------ */

export function parseSchedule(text: string): ClassSlot[] {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const slots: ClassSlot[] = [];
  let lastDay = new Date().getDay();

  for (const line of lines) {
    const dayHit = detectDay(line);
    if (dayHit !== null) lastDay = dayHit;

    const time = line.match(TIME_RANGE);
    if (!time) continue;

    const codeMatch = line.match(COURSE_CODE);
    const code = codeMatch ? codeMatch[1].replace(/\s+/g, "") : "";

    let rest = line
      .replace(TIME_RANGE, " ")
      .replace(codeMatch?.[0] ?? "", " ")
      .replace(/\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/gi, " ");
    rest = cleanLine(rest);

    const segments = rest
      .split(/\s{2,}|,|\/|\u2022/)
      .map((s) => s.trim())
      .filter(Boolean);

    const faculty = extractFaculty(segments);
    const room = detectRoom(line);
    const name =
      segments
        .filter((s) => s !== faculty && !s.includes(room) && /[A-Za-z]{3,}/.test(s))
        .sort((a, b) => b.length - a.length)[0] ?? code;

    slots.push({
      id: uid("slot"),
      day: lastDay,
      start: to24h(Number(time[1]), Number(time[2]), time[3]),
      end: to24h(Number(time[4]), Number(time[5]), time[6] ?? time[3]),
      code: code || "SUB",
      name: titleCase(name.replace(/[^A-Za-z0-9&\- ]/g, "").trim()) || code || "Untitled Class",
      faculty,
      room,
      session: detectSession(line),
    });
  }

  return slots.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
}

/* ------------------------------------------------------------------ */
/* attendance parser                                                   */
/* ------------------------------------------------------------------ */

export function parseAttendance(text: string): Subject[] {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const out: Subject[] = [];

  for (const line of lines) {
    if (/total|overall|percentage\s*$/i.test(line) && !COURSE_CODE.test(line)) continue;

    const codeMatch = line.match(COURSE_CODE);
    if (!codeMatch) continue;

    const numbers = (line.match(/\d+(?:\.\d+)?%?/g) ?? [])
      .filter((n) => !codeMatch[0].includes(n))
      .map((n) => ({ raw: n, value: parseFloat(n), isPct: n.includes(".") || n.includes("%") }));

    const counts = numbers.filter((n) => !n.isPct && n.value <= 400).map((n) => n.value);
    const pctToken = numbers.find((n) => n.isPct && n.value <= 100);

    let present = 0;
    let total = 0;
    if (counts.length >= 3) {
      const [a, b, c] = counts.slice(-3);
      // ERP prints Present | Absent | Total
      present = a;
      total = c >= a + b ? c : a + b;
    } else if (counts.length === 2) {
      const [a, b] = counts;
      total = Math.max(a, b);
      present = Math.min(a, b);
    } else if (counts.length === 1 && pctToken) {
      total = counts[0];
      present = Math.round((pctToken.value / 100) * total);
    }

    const absent = Math.max(0, total - present);

    let rest = cleanLine(line.replace(codeMatch[0], " ").replace(/\d+(?:\.\d+)?%?/g, " "));
    const segments = rest
      .split(/\s{2,}|,|\/|\u2022/)
      .map((s) => s.trim())
      .filter(Boolean);
    const faculty = extractFaculty(segments);
    const name =
      segments.filter((s) => s !== faculty && /[A-Za-z]{3,}/.test(s)).sort((a, b) => b.length - a.length)[0] ??
      codeMatch[1];

    out.push({
      code: codeMatch[1].replace(/\s+/g, ""),
      name: titleCase(name.replace(/[^A-Za-z0-9&\- ]/g, "").trim()) || codeMatch[1],
      faculty,
      present,
      absent,
      total,
    });
  }

  const merged = new Map<string, Subject>();
  for (const s of out) merged.set(s.code, s);
  return [...merged.values()];
}

export function subjectsFromTimetable(slots: ClassSlot[]): Subject[] {
  const map = new Map<string, Subject>();
  for (const s of slots) {
    if (!map.has(s.code)) {
      map.set(s.code, {
        code: s.code,
        name: s.name,
        faculty: s.faculty,
        present: 0,
        absent: 0,
        total: 0,
      });
    }
  }
  return [...map.values()];
}
