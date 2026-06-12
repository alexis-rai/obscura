import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, jsonCors } from "@/lib/cors";

export const Route = createFileRoute("/api/public/deanonymize")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const { verifyApiKey } = await import("@/lib/verify-key.server");
        const { deanonymize } = await import("@/lib/anonymizer.server");

        const apiKey = request.headers.get("x-api-key");
        const check = await verifyApiKey(apiKey);
        if (!check.ok) return jsonCors({ error: check.error }, check.status);

        let body: { text?: unknown; map?: unknown };
        try {
          body = await request.json();
        } catch {
          return jsonCors({ error: "JSON invalide." }, 400);
        }
        const text = typeof body.text === "string" ? body.text : "";
        const map =
          body.map && typeof body.map === "object" && !Array.isArray(body.map)
            ? (body.map as Record<string, string>)
            : {};
        if (!text) return jsonCors({ error: "Texte requis." }, 400);

        return jsonCors({ deanonymizedText: deanonymize(text, map) });
      },
    },
  },
});
