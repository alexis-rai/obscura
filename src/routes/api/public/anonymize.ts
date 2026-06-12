import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, jsonCors } from "@/lib/cors";

export const Route = createFileRoute("/api/public/anonymize")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const { verifyApiKey } = await import("@/lib/verify-key.server");
        const { anonymize } = await import("@/lib/anonymizer.server");

        const apiKey = request.headers.get("x-api-key");
        const check = await verifyApiKey(apiKey);
        if (!check.ok) return jsonCors({ error: check.error }, check.status);

        let body: { prompt?: unknown };
        try {
          body = await request.json();
        } catch {
          return jsonCors({ error: "JSON invalide." }, 400);
        }
        const prompt = typeof body.prompt === "string" ? body.prompt : "";
        if (!prompt || prompt.length > 20000) {
          return jsonCors({ error: "Prompt requis (max 20000 caractères)." }, 400);
        }

        const { anonymized, map } = anonymize(prompt);
        return jsonCors({ anonymizedPrompt: anonymized, map });
      },
    },
  },
});
