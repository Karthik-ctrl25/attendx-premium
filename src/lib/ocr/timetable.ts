/**
 * Timetable OCR pipeline (admin only).
 *
 * UI-facing entry point, fully independent from the attendance OCR pipeline.
 * Provider-specific code lives in `./timetable-vision.functions` — this module
 * only orchestrates, normalises and validates.
 */
import { preprocessScreenshot } from "./preprocess";
import { extractTimetableVision, type TimetableVisionRow } from "./timetable-vision.functions";

export type TimetableOcrStage =
  | "Uploading..."
  | "Reading Layout..."
  | "Recognizing Classes..."
  | "Validating Timetable..."
  | "Preparing Preview..."
  | "Done";

export const TIMETABLE_OCR_STAGES: TimetableOcrStage[] = [
  "Uploading...",
  "Reading Layout...",
  "Recognizing Classes...",
  "Validating Timetable...",
  "Preparing Preview...",
  "Done",
];

/** Rows below this confidence are highlighted and never published silently. */
export const TIMETABLE_CONFIDENCE_FLOOR = 90;

export const NOT_TIMETABLE_MESSAGE =
  "This does not appear to be a class timetable. Upload the weekly timetable image or PDF.";

export class NotTimetableError extends Error {
  constructor() {
    super(NOT_TIMETABLE_MESSAGE);
    this.name = "NotTimetableError";
  }
}

export type TimetableIssue =
  | "invalid-day"
  | "invalid-time"
  | "reversed-time"
  | "duplicate"
  | "overlap"
  | "missing-code"
  | "low-confidence";

/** An editable, not-yet-saved timetable row shown in the admin preview. */
export interface DraftSlot {
  /** Client-side id — never sent to the database. */
  id: string;
  day: number;
  start_time: string;
  end_time: string;
  code: string;
  name: string;
  faculty: string;
  room: string;
  session: string;
  confidence: number;
  issues: TimetableIssue[];
}

export interface TimetableExtraction {
  slots: DraftSlot[];
  confidence: number;
  headersFound: string[];
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutes = (t: string) => {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
};

let seq = 0;
export const draftId = () => `draft_${Date.now().toString(36)}_${(seq += 1)}`;

const ACCEPT_TYPES = ["image/", "application/pdf"];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Recomputes per-row and cross-row validation. Pure — safe to call on every
 * edit in the preview table.
 */
export function validateSlots(slots: DraftSlot[]): DraftSlot[] {
  const bySignature = new Map<string, number>();
  for (const s of slots) {
    const key = `${s.day}|${s.start_time}|${s.code.toUpperCase()}`;
    bySignature.set(key, (bySignature.get(key) ?? 0) + 1);
  }

  return slots.map((slot) => {
    const issues: TimetableIssue[] = [];

    if (!Number.isInteger(slot.day) || slot.day < 0 || slot.day > 6) issues.push("invalid-day");
    if (!TIME_RE.test(slot.start_time) || !TIME_RE.test(slot.end_time)) {
      issues.push("invalid-time");
    } else if (minutes(slot.end_time) <= minutes(slot.start_time)) {
      issues.push("reversed-time");
    }
    if (!slot.code.trim()) issues.push("missing-code");

    const key = `${slot.day}|${slot.start_time}|${slot.code.toUpperCase()}`;
    if ((bySignature.get(key) ?? 0) > 1) issues.push("duplicate");

    if (!issues.includes("invalid-time") && !issues.includes("reversed-time")) {
      const clash = slots.some(
        (other) =>
          other.id !== slot.id &&
          other.day === slot.day &&
          TIME_RE.test(other.start_time) &&
          TIME_RE.test(other.end_time) &&
          minutes(other.start_time) < minutes(slot.end_time) &&
          minutes(slot.start_time) < minutes(other.end_time),
      );
      if (clash) issues.push("overlap");
    }

    if (slot.confidence > 0 && slot.confidence < TIMETABLE_CONFIDENCE_FLOOR) {
      issues.push("low-confidence");
    }

    return { ...slot, issues };
  });
}

export const blockingIssues = (slots: DraftSlot[]) =>
  slots.filter((s) => s.issues.some((i) => i !== "low-confidence")).length;

export const lowConfidenceCount = (slots: DraftSlot[]) =>
  slots.filter((s) => s.issues.includes("low-confidence")).length;

export const ISSUE_LABEL: Record<TimetableIssue, string> = {
  "invalid-day": "Invalid weekday",
  "invalid-time": "Invalid time",
  "reversed-time": "End time is before start",
  duplicate: "Duplicate class",
  overlap: "Overlaps another class",
  "missing-code": "Missing subject code",
  "low-confidence": "Low confidence — please check",
};

const toDraft = (row: TimetableVisionRow): DraftSlot => ({
  id: draftId(),
  day: row.day,
  start_time: row.startTime,
  end_time: row.endTime,
  code: row.code,
  name: row.name,
  faculty: row.faculty,
  room: row.room,
  session: row.session === "Lab" ? "Lab" : "Theory",
  confidence: row.confidence,
  issues: [],
});

/**
 * Reads a timetable image / screenshot / photo / PDF and returns an editable
 * draft. Nothing is persisted — publishing is an explicit admin action.
 */
export async function extractTimetableFromFile(
  file: File,
  onStage?: (stage: TimetableOcrStage) => void,
): Promise<TimetableExtraction> {
  if (!ACCEPT_TYPES.some((t) => file.type.startsWith(t))) {
    throw new Error("Upload an image, screenshot, photo or PDF.");
  }

  onStage?.("Uploading...");
  const isPdf = file.type === "application/pdf";
  const fileDataUrl = isPdf ? await fileToDataUrl(file) : (await preprocessScreenshot(file)).dataUrl;

  onStage?.("Reading Layout...");
  const result = await extractTimetableVision({
    data: { fileDataUrl, fileName: file.name.replace(/\.[^.]+$/, "") },
  });

  if (!result.isTimetable) throw new NotTimetableError();

  onStage?.("Recognizing Classes...");
  onStage?.("Validating Timetable...");
  const slots = validateSlots(result.rows.map(toDraft)).sort(
    (a, b) => a.day - b.day || a.start_time.localeCompare(b.start_time),
  );
  if (!slots.length) throw new NotTimetableError();

  onStage?.("Preparing Preview...");
  onStage?.("Done");

  return { slots, confidence: result.confidence, headersFound: result.headersFound };
}
