/**
 * Google Gemini vision client (server-only).
 *
 * This is the single provider-specific transport for the OCR pipeline.
 * Prompts, schemas and JSON parsing live in the calling modules.
 */

const MODEL = "gemini-3.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

/** Splits `data:<mime>;base64,<payload>` into a Gemini inlineData part. */
export function dataUrlToPart(dataUrl: string): GeminiPart {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.*)$/s);
  if (!match) throw new Error("That file could not be read. Please try another upload.");
  return { inlineData: { mimeType: match[1]!, data: match[2]! } };
}

/** Gemini's schema dialect rejects `additionalProperties`; strip it recursively. */
function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema && typeof schema === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
      if (key === "additionalProperties" || key === "strict") continue;
      out[key] = toGeminiSchema(value);
    }
    return out;
  }
  return schema;
}

/**
 * Runs one JSON-schema-constrained vision request and returns the raw JSON text.
 */
export async function generateJson(options: {
  systemPrompt: string;
  parts: GeminiPart[];
  schema: unknown;
  /** Higher budgets trade latency for accuracy; 0 disables thinking. */
  thinkingBudget?: number;
}): Promise<string> {
  // Read the private credential at request time from whichever env container the
  // deploy target exposes (Node `process.env`, or an edge/worker equivalent).
  const { readServerEnv } = await import("@/lib/server-env.server");
  const apiKey = readServerEnv("GEMINI_API_KEY");
  if (!apiKey)
    throw new Error(
      "AI is not configured for this project. Set GEMINI_API_KEY in the production environment and redeploy.",
    );

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: options.systemPrompt }] },
      contents: [{ role: "user", parts: options.parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(options.schema),
        ...(options.thinkingBudget === undefined
          ? {}
          : { thinkingConfig: { thinkingBudget: options.thinkingBudget } }),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 429)
      throw new Error("AI is busy right now. Please try again shortly.");
    if (response.status === 401 || response.status === 403)
      throw new Error("AI is not configured correctly for this project.");
    throw new Error(`Vision request failed [${response.status}]: ${body.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  };
  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  return text || "{}";
}
