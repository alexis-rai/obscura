import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Globe, ChevronDown, Check } from "lucide-react";
import { supportedLanguages, languageNames, type SupportedLanguage } from "@/i18n";
import { useLang } from "@/hooks/useLang";

export function LanguageSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLang = useLang();

  function selectLanguage(newLang: SupportedLanguage) {
    setOpen(false);
    if (newLang === currentLang) return;

    // Replace the language in the current path
    const currentPath = location.pathname;
    const newPath = currentPath.replace(`/${currentLang}`, `/${newLang}`);
    navigate({ to: newPath, resetScroll: false });
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{languageNames[currentLang]}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-border bg-surface p-1 shadow-lg">
          {supportedLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => selectLanguage(lang)}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                lang === currentLang
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              }`}
            >
              <span>{languageNames[lang]}</span>
              {lang === currentLang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
