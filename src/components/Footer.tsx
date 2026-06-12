import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";

export function Footer() {
  const { t } = useTranslation();
  const lang = useLang();

  return (
    <footer className="border-t border-border/60 bg-background/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>© {new Date().getFullYear()} Obscura — {t("footer.tagline")}</span>
        </div>
        <div className="flex gap-6">
          <Link to="/$lang/privacy" params={{ lang }} className="hover:text-foreground">{t("common.privacy")}</Link>
          <Link to="/$lang/terms" params={{ lang }} className="hover:text-foreground">{t("common.terms")}</Link>
          <Link to="/$lang/contact" params={{ lang }} className="hover:text-foreground">{t("common.contact")}</Link>
        </div>
      </div>
    </footer>
  );
}
