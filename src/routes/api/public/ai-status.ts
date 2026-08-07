/**
 * Public diagnostic endpoint: reports whether the AI credential is visible to
 * the deployed server runtime. It never returns the key or any value.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/ai-status")({
  server: {
    handlers: {
      GET: async () => {
        const { describeServerEnv } = await import("@/lib/server-env.server");
        const gemini = describeServerEnv("GEMINI_API_KEY");
        return new Response(
          JSON.stringify({
            geminiConfigured: gemini.present,
            readFrom: gemini.source,
            runtimeEnvKeyCount: gemini.visibleKeyCount,
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
