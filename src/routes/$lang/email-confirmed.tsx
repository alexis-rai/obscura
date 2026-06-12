import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Shield, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/$lang/email-confirmed")({
  head: () => ({
    meta: [
      { title: "Email confirmé — Obscura" },
    ],
  }),
  component: ConfirmedPage,
});

function ConfirmedPage() {
  const { t } = useTranslation();
  const { lang } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/$lang/auth", params: { lang }, search: {} });
      }
    });
  }, [navigate, lang]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-emerald text-primary-foreground shadow-[var(--shadow-glow)]">
          <Shield className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <div className="mt-6 grid h-12 w-12 place-items-center rounded-full bg-emerald/10">
          <CheckCircle className="h-6 w-6 text-emerald" />
        </div>
        <h1 className="mt-6 text-3xl font-bold">{t("auth.emailConfirmed")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.emailConfirmedDescription")}
        </p>
        <button
          onClick={() => navigate({ to: "/$lang/dashboard", params: { lang } })}
          className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-emerald px-6 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01]"
        >
          {t("auth.goToDashboard")}
        </button>
      </div>
    </div>
  );
}
