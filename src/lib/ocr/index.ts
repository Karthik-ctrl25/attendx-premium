/**
 * OCR pipeline for CMR University ERP attendance screenshots.
 *
 * UI-facing entry point. Provider-agnostic: preprocessing lives in
 * `./preprocess`, the AI vision call lives in `./vision.functions`.
 */
import type { Subject } from "@/lib/types";

import { preprocessScreenshot } from "./preprocess";
import { extractAttendanceVision, type VisionRow } from "./vision.functions";

export type OcrStage =
  | "Uploading..."
  | "Reading Table..."
  | "Recognizing Subjects..."
  | "Extracting Attendance..."
  | "Validating Data..."
  | "Preparing Preview..."
  | "Done";

export const OCR_STAGES: OcrStage[] = [
  "Uploading...",
  "Reading Table...",
  "Recognizing Subjects...",
  "Extracting Attendance...",
  "Validating Data...",
  "Preparing Preview...",
  "Done",
];

/** Rows below this confidence are highlighted and never saved silently. */
export const CONFIDENCE_FLOOR = 90;

export const NOT_CMR_MESSAGE =
  "This does not appear to be a valid CMR University attendance screenshot.";

/** Thrown when the uploaded image is not the CMR ERP attendance page. */
export class NotCmrScreenshotError extends Error {
  constructor() {
    super(NOT_CMR_MESSAGE);
    this.name = "NotCmrScreenshotError";
  }
}

export interface AttendanceExtraction {
  subjects: Subject[];
  /** Average model confidence across rows, 0-100. */
  confidence: number;
  headersFound: string[];
}

/** Reconciles present / absent / total / percentage and flags uncertain rows. */
export function validateRow(row: VisionRow): Subject {
  let { present, absent, total } = row;
  let adjusted = false;

  const sum = present + absent;
  if (total <= 0 && sum > 0) {
    total = sum;
  } else if (sum !== total) {
    // Trust the two values that agree with the printed percentage when we can.
    if (row.percentage > 0 && total > 0) {
      const fromPct = Math.round((row.percentage / 100) * total);
      if (fromPct === present) {
        absent = total - present;
      } else if (
        total - absent >= 0 &&
        Math.round(((total - absent) / total) * 100) === Math.round(row.percentage)
      ) {
        present = total - absent;
      } else {
        total = sum;
      }
    } else {
      total = sum;
    }
    adjusted = true;
  }

  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  const printed = Math.round(row.percentage);
  const percentageMismatch = printed > 0 && Math.abs(printed - percentage) > 1;

  const confidence = Math.max(
    0,
    Math.min(100, row.confidence - (adjusted ? 15 : 0) - (percentageMismatch ? 15 : 0)),
  );

  const reasons: string[] = [];
  if (adjusted) reasons.push("Present + Absent didn't match Total");
  if (percentageMismatch) reasons.push(`ERP shows ${printed}%, the counts give ${percentage}%`);
  if (confidence < CONFIDENCE_FLOOR) reasons.push(`Read with ${confidence}% confidence`);

  return {
    code: row.courseCode || row.courseName.slice(0, 12).toUpperCase(),
    name: row.courseName || row.courseCode,
    faculty: row.faculty,
    present,
    absent,
    total,
    confidence,
    flagged: reasons.length > 0,
    flagReason: reasons.join(" · ") || undefined,
  };
}

/** Last extraction, keyed by the preprocessed image — re-uploads cost nothing. */
let lastRun: { key: string; value: AttendanceExtraction } | null = null;

/**
 * Runs the full pipeline: preprocess → layout check → AI vision → validation.
 * `onStage` reports each step so the UI can animate progress.
 * Throws `NotCmrScreenshotError` when the image is not a CMR ERP attendance page.
 */
export async function extractAttendanceFromImage(
  file: File,
  onStage?: (stage: OcrStage) => void,
): Promise<AttendanceExtraction> {
  onStage?.("Uploading...");
  // Students get a compressed JPEG: same readable text, a fraction of the bytes,
  // so the upload and the vision round-trip are much faster on mobile data.
  const image = await preprocessScreenshot(file, {
    maxEdge: 1400,
    format: "image/jpeg",
    quality: 0.82,
    scanStep: 3,
  });

  const key = `${image.dataUrl.length}:${image.dataUrl.slice(-96)}`;
  if (lastRun && lastRun.key === key) {
    onStage?.("Done");
    return lastRun.value;
  }

  onStage?.("Reading Table...");
  const result = await extractAttendanceVision({ data: { imageDataUrl: image.dataUrl } });

  if (!result.isCmrAttendancePage) throw new NotCmrScreenshotError();

  onStage?.("Recognizing Subjects...");
  onStage?.("Extracting Attendance...");

  onStage?.("Validating Data...");
  // Keyed by course code so a screenshot can never produce duplicate subjects.
  const seen = new Map<string, Subject>();
  for (const row of result.rows) {
    const subject = validateRow(row);
    if (!subject.code) continue;
    seen.set(subject.code, subject);
  }

  onStage?.("Preparing Preview...");
  const subjects = [...seen.values()];
  if (!subjects.length) throw new NotCmrScreenshotError();
  onStage?.("Done");

  const extraction = {
    subjects,
    confidence: result.confidence,
    headersFound: result.headersFound,
  };
  lastRun = { key, value: extraction };
  return extraction;
}

export { preprocessScreenshot };
export type { VisionRow };
