import { useParams } from "@tanstack/react-router";
import { supportedLanguages, type SupportedLanguage } from "@/i18n";

export function useLang(): SupportedLanguage {
  const params = useParams({ strict: false }) as { lang?: string };
  const lang = params.lang;

  if (lang && supportedLanguages.includes(lang as SupportedLanguage)) {
    return lang as SupportedLanguage;
  }
  return "fr";
}
