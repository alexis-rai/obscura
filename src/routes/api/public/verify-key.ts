import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, jsonCors } from "@/lib/cors";

export const Route = createFileRoute("/api/public/verify-key")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const { verifyApiKey } = await import("@/lib/verify-key.server");
        const apiKey = request.headers.get("x-api-key");
        const check = await verifyApiKey(apiKey);
        if (!check.ok) return jsonCors({ valid: false, error: check.error }, check.status);
        return jsonCors({ valid: true });
      },
    },
  },
});
