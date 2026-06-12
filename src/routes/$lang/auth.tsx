import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Shield, Mail, Lock, ArrowRight, CreditCard, Github } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { activateSubscription } from "@/lib/auth";

export const Route = createFileRoute("/$lang/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signup" ? "signup" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Connexion — Obscura" },
      { name: "description", content: "Connectez-vous ou créez votre compte Obscura." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const { lang } = Route.useParams();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(search.mode === "signup" ? "signup" : "login");

  useEffect(() => {
    setMode(search.mode === "signup" ? "signup" : "login");
  }, [search.mode]);
  const [step, setStep] = useState<"form" | "checkout">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccountError, setNoAccountError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      const oauthMode = localStorage.getItem("oauth_mode");
      localStorage.removeItem("oauth_mode");

      if (oauthMode === "login") {
        const createdAt = new Date(data.user.created_at).getTime();
        const now = Date.now();
        if (now - createdAt < 120_000) {
          await supabase.auth.signOut();
          setNoAccountError(true);
          setGoogleLoading(false);
          setGithubLoading(false);
          return;
        }
      }

      navigate({ to: "/$lang/dashboard", params: { lang } });
    });
  }, [navigate, lang]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { lang },
        },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      navigate({ to: "/$lang/dashboard", params: { lang } });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(t("auth.invalidCredentials"));
        return;
      }
      navigate({ to: "/$lang/dashboard", params: { lang } });
    }
  }


  async function handleCheckout() {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    if (data.user) await activateSubscription(data.user.id);
    setTimeout(() => navigate({ to: "/$lang/dashboard", params: { lang } }), 800);
  }

  async function handleGoogle() {
    setError(null);
    setNoAccountError(false);
    setGoogleLoading(true);
    localStorage.setItem("oauth_mode", mode);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/${lang}/auth`,
      },
    });
    if (error) {
      setError(t("auth.googleFailed"));
      setGoogleLoading(false);
    }
  }

  async function handleGithub() {
    setError(null);
    setNoAccountError(false);
    setGithubLoading(true);
    localStorage.setItem("oauth_mode", mode);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/${lang}/auth`,
      },
    });
    if (error) {
      setError(t("auth.githubFailed"));
      setGithubLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-emerald text-primary-foreground shadow-[var(--shadow-glow)]">
            <Shield className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 text-3xl font-bold">
            {step === "checkout" ? t("auth.activateShield") : mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "checkout"
              ? t("auth.checkoutDescription")
              : mode === "login"
              ? t("auth.loginDescription")
              : t("auth.signupDescription")}
          </p>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="glass-card mt-8 rounded-2xl p-6">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || githubLoading}
              className="mb-3 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-elevated disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? t("auth.connecting") : t("auth.continueGoogle")}
            </button>
            <button
              type="button"
              onClick={handleGithub}
              disabled={googleLoading || githubLoading}
              className="mb-3 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-elevated disabled:opacity-60"
            >
              <Github className="h-4 w-4" />
              {githubLoading ? t("auth.connecting") : t("auth.continueGithub")}
            </button>
            {mode === "signup" && (
              <p className="mb-3 text-[11px] text-center text-muted-foreground leading-relaxed">
                <Trans
                  i18nKey="auth.oauthAcceptTerms"
                  components={{
                    terms: <Link to="/$lang/terms" params={{ lang }} className="text-primary underline hover:text-foreground" />,
                    privacy: <Link to="/$lang/privacy" params={{ lang }} className="text-primary underline hover:text-foreground" />,
                  }}
                />
              </p>
            )}
            <div className="mb-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> {t("common.or")} <span className="h-px flex-1 bg-border" />
            </div>
            {noAccountError && (
              <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                <p>{t("auth.noAccountOAuth")}</p>
                <button
                  type="button"
                  onClick={() => { setNoAccountError(false); setMode("signup"); setError(null); }}
                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  {t("auth.goToSignup")}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
            )}
            <div className="space-y-4">
              <Field icon={Mail} label={t("auth.email")} type="email" value={email} onChange={setEmail} placeholder={t("auth.emailPlaceholder")} />
              <Field icon={Lock} label={t("auth.password")} type="password" value={password} onChange={setPassword} placeholder={t("auth.passwordPlaceholder")} />
            </div>
            {mode === "signup" && (
              <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  <Trans
                    i18nKey="auth.acceptTerms"
                    components={{
                      terms: <Link to="/$lang/terms" params={{ lang }} className="text-primary underline hover:text-foreground" />,
                      privacy: <Link to="/$lang/privacy" params={{ lang }} className="text-primary underline hover:text-foreground" />,
                    }}
                  />
                </span>
              </label>
            )}
            <button
              type="submit"
              disabled={loading || (mode === "signup" && !acceptedTerms)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-emerald py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] disabled:opacity-70"
            >
              {loading ? t("auth.pleaseWait") : mode === "login" ? t("auth.signIn") : t("auth.continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
            </button>
          </form>
        ) : (
          <div className="glass-card mt-8 rounded-2xl p-6">
            <div className="rounded-xl border border-border bg-background/60 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">4,90€ TTC</span>
              </div>
              <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {t("pricing.billedMonthly")}
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-emerald py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all disabled:opacity-70"
            >
              <CreditCard className="h-4 w-4" />
              {loading ? t("auth.processing") : t("auth.activateSubscription")}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t("auth.simulatedPayment")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  icon: Icon, label, type, value, onChange, placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          required
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-input/60 py-2.5 pl-10 pr-3 text-sm outline-none ring-primary/40 transition focus:border-primary focus:ring-2"
        />
      </div>
    </label>
  );
}
