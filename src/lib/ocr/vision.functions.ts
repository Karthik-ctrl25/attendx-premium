/**
 * AI vision extraction for CMR University ERP attendance screenshots.
 *
 * This is the only provider-specific module in the OCR pipeline. Swapping the
 * vision provider later means editing this file only — the UI talks to
 * `extractAttendanceFromImage` in `@/lib/ocr` and never to the provider.
 */
import { createServerFn } from "@tanstack/react-start";

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
}

const SYSTEM_PROMPT = `You read attendance screenshots from the CMR University ERP portal ("Student Attendance" / "Attendance Details" page).

The page shows one table, one row per course. Typical columns, left to right:
Sl. No | Course Code | Course Name | Faculty Name | Total Classes (or Total) | Present | Absent | Leaves Applied | Attendance Not Entered | Attendance % | Attendance Percentage

Column order can vary slightly and headers may wrap. Match values by their column header, never by position alone.

Rules:
- Return one object per course row. Skip header rows, summary/total/overall rows, pagination text, navigation and any legend.
- IGNORE these columns entirely: Sl. No / serial number, Leaves Applied, Attendance Not Entered.
- Course codes look like 4ENCE2061, 24BSCS101, MAT201. Read them character by character; do not guess or "fix" them.
- present, absent and total are integers. percentage is a number 0-100.
- If a value is genuinely unreadable, use 0 and lower that row's confidence.
- confidence is your certainty for that row, 0-100. Use below 90 whenever any cell is blurry, cropped, ambiguous, or inferred.
- Never invent rows, courses, faculty or numbers. If the screenshot is not a CMR ERP attendance table, return an empty rows array.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
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
  required: ["rows"],
} as const;

function validateInput(input: unknown): { imageDataUrl: string } {
  const data = input as { imageDataUrl?: unknown };
  const url = typeof data?.imageDataUrl === "string" ? data.imageDataUrl : "";
  if (!url.startsWith("data:image/")) throw new Error("An image is required.");
  if (url.length > 12_000_000) throw new Error("That image is too large. Try a smaller screenshot.");
  return { imageDataUrl: url };
}

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const extractAttendanceVision = createServerFn({ method: "POST" })
  .inputValidator(validateInput)
  .handler(async ({ data }): Promise<VisionResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract every course row from this CMR University ERP attendance screenshot as JSON.",
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "attendance_table", strict: true, schema: SCHEMA },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) throw new Error("AI is busy right now. Please try again shortly.");
      if (response.status === 402)
        throw new Error("AI credits are exhausted. Add credits to continue using OCR.");
      throw new Error(`Vision request failed [${response.status}]: ${body.slice(0, 300)}`);
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content ?? "{}";

    let parsed: { rows?: unknown[] };
    try {
      parsed = JSON.parse(content) as { rows?: unknown[] };
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
          confidence: Math.max(0, Math.min(100, Math.round(num(r.confidence)))),
        };
      })
      .filter((r) => r.courseCode || r.courseName);

    const confidence = rows.length
      ? Math.round(rows.reduce((sum, r) => sum + r.confidence, 0) / rows.length)
      : 0;

    return { rows, confidence };
  });
