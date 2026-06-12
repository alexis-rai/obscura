import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type KeyCheck =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function verifyApiKey(apiKey: string | null | undefined): Promise<KeyCheck> {
  if (!apiKey || apiKey.trim() === "") {
    return { ok: false, status: 401, error: "Clé API manquante." };
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, subscription_status, subscription_ends_at")
    .eq("api_key", apiKey.trim())
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 403, error: "Clé API invalide." };
  }
  if (data.subscription_status !== "active") {
    return { ok: false, status: 403, error: "Abonnement inactif." };
  }
  if (data.subscription_ends_at && new Date(data.subscription_ends_at) < new Date()) {
    await supabaseAdmin
      .from("profiles")
      .update({ subscription_status: "inactive" })
      .eq("id", data.id);
    return { ok: false, status: 403, error: "Abonnement expiré." };
  }
  return { ok: true, userId: data.id };
}
