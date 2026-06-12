import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/$lang/terms")({
  head: () => ({
    meta: [
      { title: "Conditions Générales d'Utilisation — Obscura" },
      { name: "description", content: "Conditions générales d'utilisation du service Obscura." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();
  const articles = t("terms.articles", { returnObjects: true }) as Array<{ title: string; paragraphs: string[] }>;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold md:text-5xl">{t("terms.title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("terms.description")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("terms.lastUpdated")}
          </p>
        </div>

        <div className="mt-12 space-y-10">
          {articles.map((article, i) => (
            <section key={i} className="glass-card rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-semibold">
                Article {i + 1} — {article.title}
              </h2>
              <div className="mt-4 space-y-3">
                {article.paragraphs.map((p, j) => (
                  <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
