import { Link, useNavigate } from "@tanstack/react-router";
import { Shield, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSession, signOutAll } from "@/lib/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLang } from "@/hooks/useLang";

const ADMIN_EMAIL = "alexis.raimondi@hotmail.com";

export function Navbar() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lang = useLang();

  async function handleSignOut() {
    await signOutAll();
    navigate({ to: "/$lang", params: { lang } });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/$lang" params={{ lang }} className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-emerald text-primary-foreground shadow-[var(--shadow-glow)]">
            <Shield className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight gradient-text">
            Obscura
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href={`/${lang}#how`} className="transition-colors hover:text-foreground">{t("common.howItWorks")}</a>
          <a href={`/${lang}#pricing`} className="transition-colors hover:text-foreground">{t("common.pricing")}</a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              {user.email === ADMIN_EMAIL && (
                <Link
                  to="/$lang/admin"
                  params={{ lang }}
                  className="hidden items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-400/20 md:inline-flex"
                >
                  <Crown className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
              <Link
                to="/$lang/dashboard"
                params={{ lang }}
                className="hidden rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-elevated md:inline-flex"
              >
                {t("common.dashboard")}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("common.logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/$lang/auth" params={{ lang }} search={{ mode: undefined }} className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline">
                {t("common.login")}
              </Link>
              <Link
                to="/$lang/auth"
                params={{ lang }}
                search={{ mode: "signup" }}
                className="inline-flex items-center rounded-md bg-gradient-to-r from-primary to-emerald px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
              >
                {t("common.getStarted")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
