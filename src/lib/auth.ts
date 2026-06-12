import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_status: "active" | "inactive" | "cancelled";
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  api_key: string;
  extension_encrypts: number;
  created_at: string;
  updated_at: string;
};

export type UserStats = {
  total_requests: number;
  total_pii_detected: number;
  avg_latency_ms: number;
  requests_last_week: number;
  requests_prev_week: number;
};

export type DailyStat = {
  day: string;
  requests: number;
  pii_detected: number;
};

export function useDailyStats(userId: string | null) {
  const [data, setData] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!userId) {
      setData([]);
      return;
    }
    setLoading(true);
    const { data: rows } = await supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", userId)
      .order("day", { ascending: true });
    setData((rows as DailyStat[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { data, loading, refresh };
}

export function useUserStats(userId: string | null) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!userId) {
      setStats(null);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setStats(data as UserStats | null);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { stats, loading, refresh };
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, ready };
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { profile, loading, refresh };
}

export async function regenerateApiKey(userId: string): Promise<string | null> {
  // Generate via crypto in the browser
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const apiKey = `sk_shield_${hex}`;
  const { error } = await supabase
    .from("profiles")
    .update({ api_key: apiKey })
    .eq("id", userId);
  if (error) return null;
  return apiKey;
}

export async function activateSubscription(userId: string) {
  const now = new Date().toISOString();
  const ends = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_started_at: now,
      subscription_ends_at: ends,
    })
    .eq("id", userId);
}

export function useGlobalAvgLatency() {
  const [latency, setLatency] = useState<number>(0);

  useEffect(() => {
    supabase.rpc("get_global_avg_latency").then(({ data }) => {
      if (typeof data === "number") setLatency(data);
    });
  }, []);

  return latency;
}

export async function signOutAll() {
  await supabase.auth.signOut();
}
