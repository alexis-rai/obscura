import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supportedLanguages, type SupportedLanguage } from "@/i18n";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    const lang = params.lang as string;
    if (!supportedLanguages.includes(lang as SupportedLanguage)) {
      throw redirect({ to: "/fr" });
    }
  },
  component: LangLayout,
});

function LangLayout() {
  const { lang } = Route.useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (lang && supportedLanguages.includes(lang as SupportedLanguage)) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  return <Outlet />;
}
