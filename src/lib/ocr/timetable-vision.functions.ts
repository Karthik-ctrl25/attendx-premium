/**
 * AI vision extraction for class TIMETABLE documents (admin only).
 *
 * This is the ONLY provider-specific module of the timetable OCR pipeline and
 * is completely independent from the attendance OCR. Swapping OpenAI Vision
 * for Gemini Vision later means editing this file only — the UI talks to
 * `extractTimetableFromFile` in `@/lib/ocr/timetable`.
 */
import { createServerFn } from "@tanstack/react-start";

export interface TimetableVisionRow {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  startTime: string;
  endTime: string;
  code: string;
  name: string;
  faculty: string;
  room: string;
  /** "Theory" | "Lab" */
  session: string;
  confidence: number;
}

export interface TimetableVisionResult {
  rows: TimetableVisionRow[];
  confidence: number;
  /** True only when the document actually looks like a weekly class timetable. */
  isTimetable: boolean;
  headersFound: string[];
}

const SYSTEM_PROMPT = `You read weekly college CLASS TIMETABLE documents (image, screenshot, photo or PDF page).

STEP 1 — LAYOUT CHECK.
A timetable shows weekday rows or columns (Monday…Saturday) crossed with time periods, each cell holding a subject/course.
Set isTimetable true only when you can see weekdays AND time periods AND subject entries. Otherwise set it false and return an EMPTY rows array.

STEP 2 — EXTRACTION (only when isTimetable is true).
Return ONE object per scheduled class occurrence. A subject that occurs on three days produces three rows.
- day: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.
- startTime / endTime: 24-hour "HH:MM". Convert 9:00 AM -> "09:00", 1.30 PM -> "13:30". College periods before 08:00 printed without AM/PM are afternoon (e.g. "1:00-2:00" -> "13:00"/"14:00").
- code: subject/course code exactly as printed (e.g. 4ENCE2061, 24BSCS101). Read character by character, never guess or "fix" it. Empty string if none printed.
- name: subject name. faculty: faculty/teacher name. room: room, hall or lab number. Empty string when not printed.
- session: "Lab" when the cell says lab/practical/workshop, otherwise "Theory".
- Skip BREAK, LUNCH, RECESS, free/blank cells, library and sports rows.
- Merged cells spanning several periods are ONE row spanning the whole time range.
- confidence: 0-100 certainty for that row. Use below 90 whenever any cell is blurry, cropped, merged ambiguously or inferred.
- Never invent classes.

Do NOT try to determine department, semester or section — they are already known.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    isTimetable: { type: "boolean" },
    headersFound: { type: "array", items: { type: "string" } },
    rows: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          day: { type: "number" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          code: { type: "string" },
          name: { type: "string" },
          faculty: { type: "string" },
          room: { type: "string" },
          session: { type: "string" },
          confidence: { type: "number" },
        },
        required: [
          "day",
          "startTime",
          "endTime",
          "code",
          "name",
          "faculty",
          "room",
          "session",
          "confidence",
        ],
      },
    },
  },
  required: ["isTimetable", "headersFound", "rows"],
} as const;

interface VisionInput {
  /** `data:image/...;base64,...` or `data:application/pdf;base64,...` */
  fileDataUrl: string;
  fileName: string;
}

function validateInput(input: unknown): VisionInput {
  const data = input as { fileDataUrl?: unknown; fileName?: unknown };
  const url = typeof data?.fileDataUrl === "string" ? data.fileDataUrl : "";
  const isImage = url.startsWith("data:image/");
  const isPdf = url.startsWith("data:application/pdf");
  if (!isImage && !isPdf) throw new Error("Upload an image, screenshot, photo or PDF.");
  if (url.length > 14_000_000) throw new Error("That file is too large. Try a smaller upload.");
  return {
    fileDataUrl: url,
    fileName: typeof data?.fileName === "string" && data.fileName ? data.fileName : "timetable",
  };
}

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const normalizeConfidence = (v: number) => {
  const scaled = v > 0 && v <= 1 ? v * 100 : v;
  return Math.max(0, Math.min(100, Math.round(scaled)));
};

/** Accepts "9:00", "9.00 AM", "0900", "13:30" and returns "HH:MM" or "". */
function normalizeTime(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2})[:.]?(\d{2})?(AM|PM)?$/);
  if (!m) return "";
  let h = parseInt(m[1] ?? "", 10);
  const min = parseInt(m[2] ?? "0", 10);
  if (!Number.isFinite(h) || !Number.isFinite(min) || min > 59) return "";
  const ap = m[3];
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  if (h > 23) return "";
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export const extractTimetableVision = createServerFn({ method: "POST" })
  .inputValidator(validateInput)
  .handler(async ({ data }): Promise<TimetableVisionResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const isPdf = data.fileDataUrl.startsWith("data:application/pdf");
    const content = [
      {
        type: "text",
        text: "Extract every scheduled class from this weekly class timetable as JSON.",
      },
      isPdf
        ? {
            type: "file",
            file: { filename: `${data.fileName}.pdf`, file_data: data.fileDataUrl },
          }
        : { type: "image_url", image_url: { url: data.fileDataUrl } },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "low",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "class_timetable", strict: true, schema: SCHEMA },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429)
        throw new Error("AI is busy right now. Please try again shortly.");
      if (response.status === 402)
        throw new Error("AI credits are exhausted. Add credits to continue using OCR.");
      throw new Error(`Vision request failed [${response.status}]: ${body.slice(0, 300)}`);
    }

    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = payload.choices?.[0]?.message?.content ?? "{}";

    type Parsed = { rows?: unknown[]; isTimetable?: unknown; headersFound?: unknown };
    let parsed: Parsed;
    try {
      parsed = JSON.parse(raw) as Parsed;
    } catch {
      throw new Error("The AI response could not be read. Please try again.");
    }

    const rows: TimetableVisionRow[] = (parsed.rows ?? [])
      .map((item) => {
        const r = item as Record<string, unknown>;
        const session = str(r.session).toLowerCase().startsWith("lab") ? "Lab" : "Theory";
        return {
          day: Math.max(0, Math.min(6, Math.round(num(r.day)))),
          startTime: normalizeTime(str(r.startTime)),
          endTime: normalizeTime(str(r.endTime)),
          code: str(r.code).replace(/\s+/g, "").toUpperCase(),
          name: str(r.name),
          faculty: str(r.faculty),
          room: str(r.room),
          session,
          confidence: normalizeConfidence(num(r.confidence)),
        };
      })
      .filter((r) => r.code || r.name);

    const confidence = rows.length
      ? Math.round(rows.reduce((sum, r) => sum + r.confidence, 0) / rows.length)
      : 0;

    const headersFound = Array.isArray(parsed.headersFound)
      ? parsed.headersFound.map(str).filter(Boolean)
      : [];

    return { rows, confidence, isTimetable: parsed.isTimetable === true, headersFound };
  });
