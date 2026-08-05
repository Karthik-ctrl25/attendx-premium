/**
 * AI vision extraction for CMR University ERP attendance screenshots.
 *
 * This is the only provider-specific module in the OCR pipeline. Swapping the
 * vision provider later means editing this file only — the UI talks to
 * `extractAttendanceFromImage` in `@/lib/ocr` and never to the provider.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface VisionRow {
  courseCode: string;
  courseName: string;
  faculty: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  confidence: number;
}

export interface VisionResult {
  rows: VisionRow[];
  confidence: number;
  /** True only when the screenshot is the CMR University ERP attendance page. */
  isCmrAttendancePage: boolean;
  /** Column headers the model actually saw (for diagnostics). */
  headersFound: string[];
}

const SYSTEM_PROMPT = `You read attendance screenshots from the CMR University ERP portal ("Student Attendance" / "Attendance Details" page).

STEP 1 — LAYOUT CHECK (do this first).
A valid CMR ERP attendance screenshot shows a single table whose header row contains columns equivalent to:
Course Code, Course Name, Faculty Name, Present (Present Count), Absent (Absent Count), Total (Total Classes / Total Count), Percentage (Attendance %).
Headers may wrap, abbreviate or reorder. List every header you can read in headersFound.
Set isCmrAttendancePage true ONLY if you can see a course-attendance table with a course-code column, a course-name column, and at least two of present / absent / total / percentage.
If it is any other screen (timetable, marks, fee page, random photo, document, chat, non-CMR portal), set isCmrAttendancePage false and return an EMPTY rows array. Do not extract anything.

STEP 2 — EXTRACTION (only when isCmrAttendancePage is true).
- Return one object per course row. Skip header rows, summary/total/overall rows, pagination text, navigation and any legend.
- IGNORE these columns entirely: Sl. No / serial number, Leaves Applied, Attendance Not Entered.
- Match values by their column header, never by position alone.
- Course codes look like 4ENCE2061, 24BSCS101, MAT201. Read them character by character; do not guess or "fix" them.
- present, absent and total are integers. percentage is a number 0-100.
- If a value is genuinely unreadable, use 0 and lower that row's confidence.
- confidence is your certainty for that row, 0-100. Use below 90 whenever any cell is blurry, cropped, ambiguous, or inferred.
- Never invent rows, courses, faculty or numbers.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    isCmrAttendancePage: { type: "boolean" },
    headersFound: { type: "array", items: { type: "string" } },
    rows: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          courseCode: { type: "string" },
          courseName: { type: "string" },
          faculty: { type: "string" },
          present: { type: "number" },
          absent: { type: "number" },
          total: { type: "number" },
          percentage: { type: "number" },
          confidence: { type: "number" },
        },
        required: [
          "courseCode",
          "courseName",
          "faculty",
          "present",
          "absent",
          "total",
          "percentage",
          "confidence",
        ],
      },
    },
  },
  required: ["isCmrAttendancePage", "headersFound", "rows"],
} as const;

function validateInput(input: unknown): { imageDataUrl: string } {
  const data = input as { imageDataUrl?: unknown };
  const url = typeof data?.imageDataUrl === "string" ? data.imageDataUrl : "";
  if (!url.startsWith("data:image/")) throw new Error("An image is required.");
  if (url.length > 12_000_000)
    throw new Error("That image is too large. Try a smaller screenshot.");
  return { imageDataUrl: url };
}

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};
const normalizeConfidence = (v: number) => {
  const scaled = v > 0 && v <= 1 ? v * 100 : v;
  return Math.max(0, Math.min(100, Math.round(scaled)));
};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const extractAttendanceVision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateInput)
  .handler(async ({ data }): Promise<VisionResult> => {
    const { generateJson, dataUrlToPart } = await import("./gemini.server");

    const content = await generateJson({
      systemPrompt: SYSTEM_PROMPT,
      parts: [
        {
          text: "Extract every course row from this CMR University ERP attendance screenshot as JSON.",
        },
        dataUrlToPart(data.imageDataUrl),
      ],
      schema: SCHEMA,
      thinkingBudget: 0,
    });

    type Parsed = { rows?: unknown[]; isCmrAttendancePage?: unknown; headersFound?: unknown };
    let parsed: Parsed;
    try {
      parsed = JSON.parse(content) as Parsed;
    } catch {
      throw new Error("The AI response could not be read. Please try again.");
    }


    const rows: VisionRow[] = (parsed.rows ?? [])
      .map((raw) => {
        const r = raw as Record<string, unknown>;
        return {
          courseCode: str(r.courseCode).replace(/\s+/g, "").toUpperCase(),
          courseName: str(r.courseName),
          faculty: str(r.faculty),
          present: Math.max(0, Math.round(num(r.present))),
          absent: Math.max(0, Math.round(num(r.absent))),
          total: Math.max(0, Math.round(num(r.total))),
          percentage: num(r.percentage),
          // Some models answer on a 0-1 scale despite the instruction.
          confidence: normalizeConfidence(num(r.confidence)),
        };
      })
      .filter((r) => r.courseCode || r.courseName);

    const confidence = rows.length
      ? Math.round(rows.reduce((sum, r) => sum + r.confidence, 0) / rows.length)
      : 0;

    const headersFound = Array.isArray(parsed.headersFound)
      ? parsed.headersFound.map(str).filter(Boolean)
      : [];

    return {
      rows,
      confidence,
      isCmrAttendancePage: parsed.isCmrAttendancePage === true,
      headersFound,
    };
  });
