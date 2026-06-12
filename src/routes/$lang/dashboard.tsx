import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield, Activity, Server, AlertTriangle,
  ChevronLeft, ChevronRight, Settings, Trash2, Save, Puzzle, Lock,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSession, useProfile, useUserStats, useDailyStats, useGlobalAvgLatency, activateSubscription, signOutAll, type UserStats, type DailyStat } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/$lang/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Obscura" },
      { name: "description", content: "Gérez votre clé API et suivez vos prompts sécurisés." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const { lang } = Route.useParams();
  const { user, ready } = useSession();
  const { profile, refresh } = useProfile(user);
  const { stats } = useUserStats(user?.id ?? null);
  const { data: dailyStats } = useDailyStats(user?.id ?? null);
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (!profile) return;
    setDeleting(true);
    await supabase.from("api_usage").delete().eq("user_id", profile.id);
    await supabase.from("profiles").delete().eq("id", profile.id);
    const { error } = await supabase.rpc("delete_user");
    if (!error) {
      await signOutAll();
      navigate({ to: "/$lang", params: { lang } });
    }
    setDeleting(false);
  }

  useEffect(() => {
    if (ready && !user) navigate({ to: "/$lang/auth", params: { lang }, search: { mode: undefined } });
  }, [ready, user, navigate, lang]);

  if (!ready || !user) return null;
  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-20 text-center text-sm text-muted-foreground">
          {t("dashboard.loadingProfile")}
        </div>
      </div>
    );
  }

  const isAdmin = user.email === "alexis.raimondi@hotmail.com";
  const isExpired = !!profile.subscription_ends_at && new Date(profile.subscription_ends_at) < new Date();
  const isActive = isAdmin || (profile.subscription_status === "active" && !isExpired);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-12 w-12 rounded-full border-2 border-border"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">
                {t("dashboard.hello")} {profile.full_name || profile.email}
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{t("dashboard.title")}</h1>
            </div>
          </div>
          {isActive ? (
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-4 py-2 text-xs font-medium text-emerald sm:w-auto sm:text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald" />
              {t("dashboard.activeSubscriber")}
            </div>
          ) : (
            <button
              onClick={async () => { await activateSubscription(user.id); await refresh(); }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-400/20 sm:w-auto sm:text-sm"
            >
              <AlertTriangle className="h-4 w-4" />
              {t("dashboard.inactiveSubscription")}
            </button>
          )}
        </div>

        <div className="mt-10">
          <ServerStatus />
        </div>

        <Stats stats={stats} dailyStats={dailyStats} extensionEncrypts={profile.extension_encrypts ?? 0} />

        <AccountSettings
          profile={profile}
          onUpdate={refresh}
          onDeleteClick={() => setShowDeleteModal(true)}
        />
      </main>
      <Footer />

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-destructive/30 bg-background p-6 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t("dashboard.deleteModal.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("dashboard.deleteModal.description")}
              </p>
              <div className="mt-6 flex w-full gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? t("common.deleting") : t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ServerStatus() {
  const { t } = useTranslation();
  const globalLatency = useGlobalAvgLatency();

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald/15 text-emerald">
          <Server className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("dashboard.serverStatus.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("dashboard.serverStatus.subtitle")}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <Row label={t("dashboard.serverStatus.availability")} value="99,99%" tone="emerald" />
        <Row label={t("dashboard.serverStatus.latency")} value={`${globalLatency} ms`} />
        <Row label={t("dashboard.serverStatus.region")} value={t("dashboard.serverStatus.regionValue")} />
        <div className="flex items-center justify-between rounded-lg border border-emerald/30 bg-emerald/5 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t("dashboard.serverStatus.status")}</span>
          <span className="inline-flex items-center gap-2 font-medium text-emerald">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald" />
            {t("dashboard.serverStatus.operational")}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "emerald" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${tone === "emerald" ? "text-emerald" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function Stats({ stats, dailyStats, extensionEncrypts }: { stats: UserStats | null; dailyStats: DailyStat[]; extensionEncrypts: number }) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<"week" | "month">("week");
  const [offset, setOffset] = useState(0);


  const { chartData, periodLabel } = useMemo(() => {
    const now = new Date();
    const result: { label: string; requests: number; pii: number }[] = [];
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
    const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

    let startDate: Date;
    let endDate: Date;

    if (view === "week") {
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(now);
      startDate.setDate(now.getDate() + mondayOffset - (offset * 7));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
    }

    const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const stat = dailyStats.find(s => s.day === dateStr);

      const label = view === "week"
        ? t(`dashboard.days.${dayKeys[date.getDay()]}`)
        : `${date.getDate()}`;

      result.push({
        label,
        requests: stat?.requests ?? 0,
        pii: stat?.pii_detected ?? 0,
      });
    }

    const startMonth = t(`dashboard.months.${monthKeys[startDate.getMonth()]}`);
    const endMonth = t(`dashboard.months.${monthKeys[endDate.getMonth()]}`);

    const periodLabel = view === "week"
      ? `${startDate.getDate()} ${startMonth} - ${endDate.getDate()} ${endMonth} ${endDate.getFullYear()}`
      : `${startMonth} ${startDate.getFullYear()}`;

    return { chartData: result, periodLabel };
  }, [dailyStats, view, offset, t, i18n.language]);

  const maxValue = Math.max(...chartData.map(d => d.pii), 1);
  const periodTotal = chartData.reduce((sum, d) => sum + d.pii, 0);
  const locale = i18n.language === "fr" ? "fr-FR" : "en-US";

  function handleViewChange(newView: "week" | "month") {
    setView(newView);
    setOffset(0);
  }

  return (
    <section className="mt-10 grid gap-6 sm:grid-cols-2">
      <Kpi icon={Puzzle} label={t("dashboard.stats.extensionEncrypts")} value={extensionEncrypts.toLocaleString(locale)} sub={t("dashboard.stats.extensionSub")} />
      <Kpi icon={Activity} label={t("dashboard.stats.avgMasking")} value={`${stats?.avg_latency_ms ?? 0} ms`} sub={t("dashboard.stats.invisible")} />

      <div className="glass-card rounded-2xl p-6 sm:col-span-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t("dashboard.stats.protectionChart")}</h3>
            <p className="text-xs text-muted-foreground">
              {periodTotal.toLocaleString(locale)} {t("dashboard.stats.promptsProtected")}
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
            <button
              onClick={() => handleViewChange("week")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "week"
                  ? "bg-gradient-to-r from-primary to-emerald text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("dashboard.stats.week")}
            </button>
            <button
              onClick={() => handleViewChange("month")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "month"
                  ? "bg-gradient-to-r from-primary to-emerald text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("dashboard.stats.month")}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setOffset(o => o + 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[180px] text-center text-sm font-medium">{periodLabel}</span>
          <button
            onClick={() => setOffset(o => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex h-48 items-end gap-1 sm:gap-2">
          {chartData.map((d, i) => (
            <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-surface-elevated px-2 py-1 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                {d.pii} {t("dashboard.stats.dataEncrypted")}
              </div>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-emerald shadow-[var(--shadow-emerald)] transition-all group-hover:from-primary/50"
                style={{ height: `${Math.max((d.pii / maxValue) * 100, 2)}%` }}
              />
              <span className="text-[9px] text-muted-foreground sm:text-[10px]">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Kpi({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-5 w-5 text-emerald" />
      </div>
      <div className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function AccountSettings({
  profile,
  onUpdate,
  onDeleteClick,
}: {
  profile: { id: string; email: string; full_name: string | null };
  onUpdate: () => void;
  onDeleteClick: () => void;
}) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [email, setEmail] = useState(profile.email);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges = fullName !== (profile.full_name ?? "") || email !== profile.email;

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    if (fullName !== (profile.full_name ?? "")) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", profile.id);
    }

    if (email !== profile.email) {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) {
        setMessage({ type: "error", text: t("dashboard.settings.emailError") });
        setSaving(false);
        return;
      }
      setMessage({ type: "success", text: t("dashboard.settings.emailConfirmation") });
    } else {
      setMessage({ type: "success", text: t("dashboard.settings.savedSuccess") });
    }

    setSaving(false);
    setTimeout(() => setMessage(null), 4000);
    onUpdate();
  }

  async function handleChangePassword() {
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: t("dashboard.settings.passwordTooShort") });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: t("dashboard.settings.passwordMismatch") });
      return;
    }

    setChangingPassword(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordMessage({ type: "error", text: t("dashboard.settings.passwordError") });
      setChangingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage({ type: "error", text: t("dashboard.settings.passwordError") });
    } else {
      setPasswordMessage({ type: "success", text: t("dashboard.settings.passwordSuccess") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setChangingPassword(false);
    setTimeout(() => setPasswordMessage(null), 4000);
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-5 w-5 text-emerald" />
        <h2 className="text-xl font-bold">{t("dashboard.settings.title")}</h2>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("auth.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-input/60 px-3 py-2.5 text-sm outline-none ring-primary/40 transition focus:border-primary focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("dashboard.settings.fullName")}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("dashboard.settings.fullNamePlaceholder")}
              className="w-full rounded-lg border border-border bg-input/60 px-3 py-2.5 text-sm outline-none ring-primary/40 transition focus:border-primary focus:ring-2"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald" : "text-destructive"}`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-emerald px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="max-w-md space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald" />
              <h4 className="font-medium">{t("dashboard.settings.passwordSection")}</h4>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("dashboard.settings.currentPassword")}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-input/60 px-3 py-2.5 text-sm outline-none ring-primary/40 transition focus:border-primary focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("dashboard.settings.newPassword")}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-input/60 px-3 py-2.5 text-sm outline-none ring-primary/40 transition focus:border-primary focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{t("dashboard.settings.confirmPassword")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-input/60 px-3 py-2.5 text-sm outline-none ring-primary/40 transition focus:border-primary focus:ring-2"
              />
            </div>

            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.type === "success" ? "text-emerald" : "text-destructive"}`}>
                {passwordMessage.text}
              </p>
            )}

            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-emerald px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              {changingPassword ? t("common.saving") : t("dashboard.settings.changePassword")}
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">{t("dashboard.settings.deleteAccount")}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("dashboard.settings.deleteWarning")}
                </p>
                <button
                  onClick={onDeleteClick}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("dashboard.settings.deleteButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
