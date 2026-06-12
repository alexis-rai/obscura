import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, User, MessageSquare, Send, Clock, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/$lang/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Obscura" },
      { name: "description", content: "Contactez l'équipe Obscura pour toute question ou demande d'assistance." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedAt = useRef(Date.now());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (honeypot) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    try {
      const elapsed = Date.now() - loadedAt.current;
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, _t: elapsed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("contact.errorGeneric"));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError(t("contact.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold md:text-5xl">{t("contact.title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("contact.description")}
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {success ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald/15">
                  <CheckCircle className="h-8 w-8 text-emerald" />
                </div>
                <h2 className="mt-6 text-xl font-semibold">{t("contact.success")}</h2>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8">
                {error && (
                  <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="absolute left-[-9999px]" aria-hidden="true" tabIndex={-1}>
                  <input
                    type="text"
                    name="website"
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      {t("contact.name")}
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("contact.namePlaceholder")}
                        className="w-full rounded-lg border border-border bg-input/60 py-2.5 pl-10 pr-3 text-sm outline-none ring-primary/40 transition focus:border-primary focus:ring-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      {t("contact.email")}
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("contact.emailPlaceholder")}
                        className="w-full rounded-lg border border-border bg-input/60 py-2.5 pl-10 pr-3 text-sm outline-none ring-primary/40 transition focus:border-primary focus:ring-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                      {t("contact.message")}
                    </label>
                    <div className="relative">
                      <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("contact.messagePlaceholder")}
                        className="w-full resize-none rounded-lg border border-border bg-input/60 py-2.5 pl-10 pr-3 text-sm outline-none ring-primary/40 transition focus:border-primary focus:ring-2"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-emerald py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] disabled:opacity-70"
                  >
                    <Send className="h-4 w-4" />
                    {loading ? t("contact.sending") : t("contact.send")}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold">{t("contact.info.title")}</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-emerald" />
                  <div>
                    <p className="text-sm font-medium">{t("contact.info.emailLabel")}</p>
                    <a
                      href="mailto:contact@obscura.ai"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      contact@obscura.ai
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-emerald" />
                  <div>
                    <p className="text-sm font-medium">{t("contact.info.responseTime")}</p>
                    <p className="text-sm text-muted-foreground">{t("contact.info.responseValue")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
