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

export interface AttendanceExtraction {
  subjects: Subject[];
  /** Average model confidence across rows, 0-100. */
  confidence: number;
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
      } else if (total - absent >= 0 && Math.round(((total - absent) / total) * 100) === Math.round(row.percentage)) {
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

  return {
    code: row.courseCode || row.courseName.slice(0, 12).toUpperCase(),
    name: row.courseName || row.courseCode,
    faculty: row.faculty,
    present,
    absent,
    total,
    confidence,
    flagged: confidence < CONFIDENCE_FLOOR,
  };
}

/**
 * Runs the full pipeline: preprocess → AI vision → validation.
 * `onStage` reports each step so the UI can animate progress.
 */
export async function extractAttendanceFromImage(
  file: File,
  onStage?: (stage: OcrStage) => void,
): Promise<AttendanceExtraction> {
  onStage?.("Uploading...");
  const image = await preprocessScreenshot(file);

  onStage?.("Reading Table...");
  const result = await extractAttendanceVision({ data: { imageDataUrl: image.dataUrl } });

  onStage?.("Recognizing Subjects...");
  onStage?.("Extracting Attendance...");

  onStage?.("Validating Data...");
  const seen = new Map<string, Subject>();
  for (const row of result.rows) {
    const subject = validateRow(row);
    if (!subject.code) continue;
    seen.set(subject.code, subject);
  }

  onStage?.("Preparing Preview...");
  const subjects = [...seen.values()];
  onStage?.("Done");

  return { subjects, confidence: result.confidence };
}

export { preprocessScreenshot };
export type { VisionRow };
