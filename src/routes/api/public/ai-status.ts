/**
 * Public diagnostic endpoint: reports whether the AI credential is visible to
 * the deployed server runtime, and (optionally) whether a live model call
 * actually succeeds. It never returns the key or any value.
 *
 * GET /api/public/ai-status        → presence only
 * GET /api/public/ai-status?ping=1 → also makes one tiny live model call
 */
import { createFileRoute } from "@tanstack/react-router";

const MODEL = "gemini-3.5-flash";

export const Route = createFileRoute("/api/public/ai-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { describeServerEnv, readServerEnv } = await import("@/lib/server-env.server");
        const gemini = describeServerEnv("GEMINI_API_KEY");

        let ping: { ok: boolean; status: number; reason?: string } | null = null;
        if (new URL(request.url).searchParams.get("ping") && gemini.present) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-goog-api-key": readServerEnv("GEMINI_API_KEY") ?? "",
                },
                body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
              },
            );
            ping = {
              ok: response.ok,
              status: response.status,
              ...(response.ok
                ? {}
                : { reason: (await response.text()).replace(/key=[\w-]+/gi, "key=***").slice(0, 300) }),
            };
          } catch (error) {
            ping = {
              ok: false,
              status: 0,
              reason: error instanceof Error ? error.message : "network error",
            };
          }
        }

        return new Response(
          JSON.stringify({
            geminiConfigured: gemini.present,
            readFrom: gemini.source,
            runtimeEnvKeyCount: gemini.visibleKeyCount,
            model: MODEL,
            ping,
            runtime:
              typeof navigator !== "undefined" && navigator.userAgent
                ? navigator.userAgent
                : "unknown",
          }),
          { headers: { "content-type": "application/json", "cache-control": "no-store" } },
        );
      },
    },
  },
});
