import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield, Users, Trash2, UserCheck, UserX, Crown, Calendar as CalendarIcon, Infinity,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ADMIN_EMAIL = "alexis.raimondi@hotmail.com";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string;
  subscription_ends_at: string | null;
  extension_encrypts: number;
  created_at: string;
  is_admin: boolean;
};

export const Route = createFileRoute("/$lang/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Obscura" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = useTranslation();
  const { lang } = Route.useParams();
  const { user, ready } = useSession();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<UserRow | null>(null);
  const [editingEndDate, setEditingEndDate] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (ready && !user) navigate({ to: "/$lang/auth", params: { lang }, search: { mode: undefined } });
    if (ready && user && !isAdmin) navigate({ to: "/$lang/dashboard", params: { lang } });
  }, [ready, user, isAdmin, navigate, lang]);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase.rpc("admin_list_users");
    setUsers((data as UserRow[]) ?? []);
    setLoading(false);
  }

  async function toggleSubscription(target: UserRow) {
    setActionLoading(target.id);
    const newStatus = target.subscription_status === "active" ? "inactive" : "active";
    await supabase.rpc("admin_update_user", {
      target_user_id: target.id,
      new_status: newStatus,
    });
    await loadUsers();
    setActionLoading(null);
  }

  async function updateEndDate(target: UserRow, date: Date | undefined) {
    setActionLoading(target.id);
    const newEndsAt = date ? format(date, "yyyy-MM-dd") : "never";
    await supabase.rpc("admin_update_user", {
      target_user_id: target.id,
      new_status: target.subscription_status,
      new_ends_at: newEndsAt,
    });
    setEditingEndDate(null);
    await loadUsers();
    setActionLoading(null);
  }

  async function deleteUser(target: UserRow) {
    setActionLoading(target.id);
    await supabase.rpc("admin_delete_user", { target_user_id: target.id });
    setShowDeleteModal(null);
    await loadUsers();
    setActionLoading(null);
  }

  if (!ready || !user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{t("admin.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
          </div>
        </div>

        <div className="mt-8 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-emerald" />
              <h2 className="text-lg font-semibold">{t("admin.usersTitle")}</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {users.length} {t("admin.usersCount")}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("common.loading")}</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-sm">
                        {u.full_name || u.email.split("@")[0]}
                      </p>
                      {u.is_admin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          <Crown className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{u.extension_encrypts ?? 0} {t("admin.encryptions")}</span>
                      <span className="hidden sm:inline text-border">|</span>
                      <span>{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
                      <span className="hidden sm:inline text-border">|</span>
                      <Popover open={editingEndDate === u.id} onOpenChange={(open) => setEditingEndDate(open ? u.id : null)}>
                        <PopoverTrigger asChild>
                          <button
                            className={`inline-flex items-center gap-1 transition-colors ${
                              u.subscription_ends_at && new Date(u.subscription_ends_at) < new Date()
                                ? "text-destructive hover:text-destructive/80"
                                : "hover:text-foreground"
                            }`}
                            title={t("admin.editEndDate")}
                          >
                            {u.subscription_ends_at ? (
                              <span>
                                {new Date(u.subscription_ends_at).toLocaleDateString("fr-FR")}
                                {new Date(u.subscription_ends_at) < new Date() && " (expiré)"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5">
                                <Infinity className="h-3 w-3" /> never
                              </span>
                            )}
                            <CalendarIcon className="h-3 w-3 opacity-50" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={u.subscription_ends_at ? new Date(u.subscription_ends_at) : undefined}
                            onSelect={(date) => updateEndDate(u, date)}
                            locale={fr}
                            defaultMonth={u.subscription_ends_at ? new Date(u.subscription_ends_at) : new Date()}
                          />
                          {u.subscription_ends_at && (
                            <div className="border-t border-border p-2">
                              <button
                                onClick={() => updateEndDate(u, undefined)}
                                className="w-full rounded px-2 py-1 text-xs text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
                              >
                                Retirer la date (never)
                              </button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        u.subscription_status === "active"
                          ? "border border-emerald/30 bg-emerald/10 text-emerald"
                          : "border border-border bg-surface text-muted-foreground"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        u.subscription_status === "active" ? "bg-emerald" : "bg-muted-foreground"
                      }`} />
                      {u.subscription_status === "active" ? t("admin.active") : t("admin.inactive")}
                    </span>

                    {!u.is_admin && (
                      <>
                        <button
                          onClick={() => toggleSubscription(u)}
                          disabled={actionLoading === u.id}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground disabled:opacity-50"
                          title={u.subscription_status === "active" ? t("admin.deactivate") : t("admin.activate")}
                        >
                          {u.subscription_status === "active" ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(u)}
                          disabled={actionLoading === u.id}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/30 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                          title={t("admin.deleteUser")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(null)}
          />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-destructive/30 bg-background p-6 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t("admin.deleteModal.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("admin.deleteModal.description", { email: showDeleteModal.email })}
              </p>
              <div className="mt-6 flex w-full gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => deleteUser(showDeleteModal)}
                  disabled={actionLoading === showDeleteModal.id}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {actionLoading === showDeleteModal.id ? t("common.deleting") : t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
