import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, jsonCors } from "@/lib/cors";

const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

export const Route = createFileRoute("/api/public/contact")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
          || request.headers.get("x-real-ip")
          || "unknown";

        const now = Date.now();
        const timestamps = (rateLimit.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW);
        if (timestamps.length >= RATE_LIMIT_MAX) {
          return jsonCors({ error: "Trop de messages envoyés. Réessayez plus tard." }, 429);
        }

        let body: { name?: string; email?: string; message?: string; _t?: number };
        try {
          body = await request.json();
        } catch {
          return jsonCors({ error: "JSON invalide." }, 400);
        }

        if (typeof body._t === "number" && body._t < 3000) {
          return jsonCors({ success: true });
        }

        const { name, email, message } = body;

        if (!name || typeof name !== "string" || name.trim().length < 2) {
          return jsonCors({ error: "Nom requis (min 2 caractères)." }, 400);
        }
        if (!email || typeof email !== "string" || !isValidEmail(email.trim())) {
          return jsonCors({ error: "Email invalide." }, 400);
        }
        if (!message || typeof message !== "string" || message.trim().length < 10) {
          return jsonCors({ error: "Message requis (min 10 caractères)." }, 400);
        }
        if (message.length > 5000) {
          return jsonCors({ error: "Message trop long (max 5000 caractères)." }, 400);
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          console.error("RESEND_API_KEY not configured");
          return jsonCors({ error: "Service email non configuré." }, 500);
        }

        try {
          const { Resend } = await import("resend");
          const resend = new Resend(resendApiKey);

          await resend.emails.send({
            from: "Obscura <onboarding@resend.dev>",
            to: "alexis.raimondi@hotmail.com",
            replyTo: email.trim(),
            subject: "Nouveau message depuis Obscura",
            html: `
              <h2>Nouveau message de contact</h2>
              <p><strong>Nom:</strong> ${escapeHtml(name.trim())}</p>
              <p><strong>Email:</strong> ${escapeHtml(email.trim())}</p>
              <hr />
              <p><strong>Message:</strong></p>
              <p>${escapeHtml(message.trim()).replace(/\n/g, "<br />")}</p>
            `,
          });

          timestamps.push(now);
          rateLimit.set(ip, timestamps);
          return jsonCors({ success: true });
        } catch (err) {
          console.error("Failed to send email:", err);
          return jsonCors({ error: "Échec de l'envoi du message." }, 500);
        }
      },
    },
  },
});

function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!re.test(email)) return false;
  const [, domain] = email.split("@");
  if (!domain.includes(".")) return false;
  const tld = domain.split(".").pop()!;
  if (tld.length < 2) return false;
  return true;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
