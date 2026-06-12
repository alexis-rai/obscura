import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Shield, Lock, CheckCircle, Eye, ArrowRight, Zap,
  Server, Sparkles, FileWarning, Brain,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/$lang/")({
  head: () => ({
    meta: [
      { title: "Obscura — Anonymisez vos prompts IA en temps réel" },
      { name: "description", content: "Extension Chrome qui masque vos données sensibles avant qu'elles n'atteignent ChatGPT, Gemini ou Claude. 4,90€ TTC, sans engagement." },
      { property: "og:title", content: "Obscura — Sécurisez vos conversations avec l'IA" },
      { property: "og:description", content: "Utilisez la puissance de l'IA sans offrir vos données privées." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Trust />
      <HowItWorks />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}

function Hero() {
  const { t } = useTranslation();
  const { lang } = Route.useParams();

  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-28">
      <div className="pointer-events-none absolute inset-0 [background:var(--gradient-hero)]" />
      <div className="relative mx-auto max-w-5xl text-center">
        <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-7xl">
          {t("hero.title")}<br />
          <span className="gradient-text">{t("hero.titleHighlight")}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("hero.description")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#install"
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-emerald px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
          >
            <Shield className="h-5 w-5" />
            {t("hero.installExtension")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <Link
            to="/$lang/auth"
            params={{ lang }}
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3.5 text-base font-medium transition-colors hover:bg-surface-elevated"
          >
            {t("hero.tryNow")}
          </Link>
        </div>

        <div className="relative mx-auto mt-16 max-w-3xl">
          <PromptDemo />
        </div>
      </div>
    </section>
  );
}

function PromptDemo() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-1 shadow-[var(--shadow-elegant)] backdrop-blur-xl">
      <div className="flex items-center gap-1.5 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald/70" />
        <span className="ml-3 text-xs text-muted-foreground">{t("demo.protectedBy")}</span>
      </div>
      <div className="grid gap-4 rounded-xl bg-background/60 p-6 text-left text-sm md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("demo.youType")}</div>
          <p className="rounded-lg border border-border bg-surface p-4 leading-relaxed">
            {t("demo.prompt")} <span className="rounded bg-destructive/20 px-1 text-destructive-foreground">jean.dupont@acme.fr</span> {t("demo.prompt2")} <span className="rounded bg-destructive/20 px-1 text-destructive-foreground">M. Bernard</span>.
          </p>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald">{t("demo.aiReceives")}</div>
          <p className="rounded-lg border border-emerald/40 bg-emerald/5 p-4 leading-relaxed">
            {t("demo.prompt")} <span className="rounded bg-emerald/20 px-1 font-mono text-xs text-emerald">[EMAIL_1]</span> {t("demo.prompt2")} <span className="rounded bg-emerald/20 px-1 font-mono text-xs text-emerald">[NAME_1]</span>. <span className="font-mono text-xs text-cyan">[Obscura AI]</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Trust() {
  const { t } = useTranslation();

  const items = [
    { icon: Lock, label: t("trust.encryption") },
    { icon: Server, label: t("trust.servers") },
    { icon: Shield, label: t("trust.gdpr") },
    { icon: Brain, label: t("trust.multiModel") },
  ];
  return (
    <section className="border-y border-border/60 bg-surface/30 py-8">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald">{t("howItWorks.badge")}</p>
          <h2 className="mt-3 text-4xl font-bold md:text-5xl">{t("howItWorks.title")}</h2>
          <p className="mt-4 text-muted-foreground">
            {t("howItWorks.description")}
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <Step
            n="01"
            badge={t("howItWorks.step1Badge")}
            badgeColor="primary"
            icon={Lock}
            title={t("howItWorks.step1Title")}
            text={t("howItWorks.step1Text")}
            example={<>
              <code className="text-destructive line-through opacity-60 break-all">jean.dupont@acme.fr</code>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <code className="rounded bg-emerald/15 px-2 py-0.5 text-emerald">[EMAIL_1]</code>
            </>}
          />
          <Step
            n="02"
            badge={t("howItWorks.step2Badge")}
            badgeColor="emerald"
            icon={CheckCircle}
            title={t("howItWorks.step2Title")}
            text={t("howItWorks.step2Text")}
            example={<>
              <code className="rounded bg-emerald/15 px-2 py-0.5 text-emerald">[EMAIL_1]</code>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <code className="text-foreground break-all">jean.dupont@acme.fr</code>
              <CheckCircle className="ml-1 h-3.5 w-3.5 shrink-0 text-emerald" />
            </>}
          />
        </div>

        <div className="relative mt-10 rounded-2xl border-2 border-emerald/40 bg-emerald/5 p-4 shadow-[var(--shadow-emerald)] sm:p-6">
          <div className="absolute -top-3 left-6 rounded-full bg-emerald px-3 py-0.5 text-xs font-bold text-emerald-foreground">
            ✓ data-shield-state="done"
          </div>
          <p className="text-sm leading-relaxed">
            <strong>{t("howItWorks.restoredResponse")}</strong> {t("howItWorks.restoredText")}
            <strong className="text-foreground"> jean.dupont@acme.fr </strong>
            {t("howItWorks.restoredText2")}
            <strong className="text-foreground"> M. Bernard</strong>. »
          </p>
          <p className="mt-2 text-xs text-emerald">{t("howItWorks.greenBorder")}</p>
        </div>
      </div>
    </section>
  );
}

function Step({
  n, badge, badgeColor, icon: Icon, title, text, example,
}: {
  n: string; badge: string; badgeColor: "primary" | "emerald";
  icon: React.ComponentType<{ className?: string }>;
  title: string; text: string; example: React.ReactNode;
}) {
  const accent = badgeColor === "emerald" ? "text-emerald border-emerald/30 bg-emerald/10" : "text-primary border-primary/30 bg-primary/10";
  return (
    <div className="glass-card relative overflow-hidden rounded-2xl p-8">
      <div className="flex items-start justify-between">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${accent}`}>
          <Icon className="h-3.5 w-3.5" />
          {badge}
        </div>
        <span className="font-display text-5xl font-bold text-muted-foreground/20">{n}</span>
      </div>
      <h3 className="mt-6 text-2xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/60 px-4 py-3 font-mono text-xs">
        {example}
      </div>
    </div>
  );
}

function Features() {
  const { t } = useTranslation();

  const items = [
    { icon: Zap, title: t("features.latencyTitle"), text: t("features.latencyText") },
    { icon: FileWarning, title: t("features.piiTitle"), text: t("features.piiText") },
    { icon: Eye, title: t("features.auditTitle"), text: t("features.auditText") },
  ];
  return (
    <section className="px-6 py-20">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="glass-card rounded-xl p-6">
            <Icon className="h-6 w-6 text-emerald" />
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useTranslation();
  const { lang } = Route.useParams();

  const features = [
    t("pricing.features.unlimited"),
    t("pricing.features.realtime"),
    t("pricing.features.autoRestore"),
    t("pricing.features.dashboard"),
  ];

  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald">{t("pricing.badge")}</p>
        <h2 className="mt-3 text-4xl font-bold md:text-5xl">{t("pricing.title")}</h2>
        <p className="mt-4 text-muted-foreground">{t("pricing.description")}</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
        {/* Plan Mensuel */}
        <div className="relative rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-elegant)] sm:p-8">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">{t("pricing.monthly")}</span>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold tracking-tight sm:text-6xl">4,90€</span>
            <span className="text-muted-foreground">{t("pricing.perMonth")}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("pricing.billedMonthly")}
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/$lang/auth"
            params={{ lang }}
            search={{ mode: "signup" }}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald py-4 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01]"
          >
            <Shield className="h-5 w-5" />
            {t("pricing.subscribeMonthly")}
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">{t("pricing.securePayment")}</p>
        </div>

        {/* Plan Annuel */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-primary to-emerald opacity-60 blur-lg" />
          <div className="relative rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-elegant)] sm:p-8">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald/15 px-3 py-1 text-xs font-semibold text-emerald">{t("pricing.annually")}</span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold tracking-tight sm:text-6xl">3,95€</span>
              <span className="text-muted-foreground">{t("pricing.perMonth")}</span>
            </div>
            <p className="mt-2 text-sm text-emerald">
              {t("pricing.billedAnnually")}
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/$lang/auth"
              params={{ lang }}
              search={{ mode: "signup" }}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald py-4 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01]"
            >
              <Shield className="h-5 w-5" />
              {t("pricing.subscribeAnnually")}
            </Link>
            <p className="mt-3 text-center text-xs text-muted-foreground">{t("pricing.securePayment")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
