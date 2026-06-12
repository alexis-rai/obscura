import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Shield, Lock, Server, Eye, Trash2, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/$lang/privacy")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Obscura" },
      { name: "description", content: "Politique de confidentialité d'Obscura. Découvrez comment nous protégeons vos données personnelles." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: Eye,
      title: t("privacy.dataCollected.title"),
      content: t("privacy.dataCollected.content"),
      items: [
        t("privacy.dataCollected.item1"),
        t("privacy.dataCollected.item2"),
        t("privacy.dataCollected.item3"),
        t("privacy.dataCollected.item4"),
      ],
    },
    {
      icon: Lock,
      title: t("privacy.dataUsage.title"),
      content: t("privacy.dataUsage.content"),
      items: [
        t("privacy.dataUsage.item1"),
        t("privacy.dataUsage.item2"),
        t("privacy.dataUsage.item3"),
      ],
    },
    {
      icon: Shield,
      title: t("privacy.anonymization.title"),
      content: t("privacy.anonymization.content"),
      items: [
        t("privacy.anonymization.item1"),
        t("privacy.anonymization.item2"),
        t("privacy.anonymization.item3"),
      ],
    },
    {
      icon: Server,
      title: t("privacy.storage.title"),
      content: t("privacy.storage.content"),
      items: [
        t("privacy.storage.item1"),
        t("privacy.storage.item2"),
        t("privacy.storage.item3"),
      ],
    },
    {
      icon: Trash2,
      title: t("privacy.rights.title"),
      content: t("privacy.rights.content"),
      items: [
        t("privacy.rights.item1"),
        t("privacy.rights.item2"),
        t("privacy.rights.item3"),
        t("privacy.rights.item4"),
      ],
    },
    {
      icon: Mail,
      title: t("privacy.contact.title"),
      content: t("privacy.contact.content"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold md:text-5xl">{t("privacy.title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("privacy.description")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("privacy.lastUpdated")}
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {sections.map(({ icon: Icon, title, content, items }) => (
            <section key={title} className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald/10">
                  <Icon className="h-5 w-5 text-emerald" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {content}
                  </p>
                  {items && (
                    <ul className="mt-4 space-y-2">
                      {items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
