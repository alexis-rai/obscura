import { Link, useNavigate } from "@tanstack/react-router";
import { Shield, Crown, Menu, X } from "lucide-react";
import { useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOutAll();
    setMobileOpen(false);
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
                className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
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
                className="hidden items-center rounded-md bg-gradient-to-r from-primary to-emerald px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] md:inline-flex"
              >
                {t("common.getStarted")}
              </Link>
            </>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            <a
              href={`/${lang}#how`}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              {t("common.howItWorks")}
            </a>
            <a
              href={`/${lang}#pricing`}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              {t("common.pricing")}
            </a>
            {user ? (
              <>
                {user.email === ADMIN_EMAIL && (
                  <Link
                    to="/$lang/admin"
                    params={{ lang }}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-surface"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
                <Link
                  to="/$lang/dashboard"
                  params={{ lang }}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  {t("common.dashboard")}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  {t("common.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/$lang/auth"
                  params={{ lang }}
                  search={{ mode: undefined }}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  {t("common.login")}
                </Link>
                <Link
                  to="/$lang/auth"
                  params={{ lang }}
                  search={{ mode: "signup" }}
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-emerald px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                >
                  {t("common.getStarted")}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
