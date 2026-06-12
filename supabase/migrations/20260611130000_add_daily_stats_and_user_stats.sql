-- Drop existing view if it exists (was previously a view, now needs to be a table)
DROP VIEW IF EXISTS public.daily_stats;

-- Table daily_stats: one row per user per day
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  requests INTEGER NOT NULL DEFAULT 0,
  pii_detected INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, day)
);

GRANT SELECT, INSERT, UPDATE ON public.daily_stats TO authenticated;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own daily_stats" ON public.daily_stats;
CREATE POLICY "Users can view own daily_stats"
  ON public.daily_stats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily_stats" ON public.daily_stats;
CREATE POLICY "Users can insert own daily_stats"
  ON public.daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily_stats" ON public.daily_stats;
CREATE POLICY "Users can update own daily_stats"
  ON public.daily_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.user_stats;

-- Table user_stats: aggregated stats per user
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_pii_detected INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms INTEGER NOT NULL DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user_stats" ON public.user_stats;
CREATE POLICY "Users can view own user_stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_stats" ON public.user_stats;
CREATE POLICY "Users can insert own user_stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_stats" ON public.user_stats;
CREATE POLICY "Users can update own user_stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RPC to record a protection event (called by the extension on each encryption)
CREATE OR REPLACE FUNCTION public.record_protection_event(pii_count INTEGER DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.daily_stats (user_id, day, requests, pii_detected)
  VALUES (auth.uid(), CURRENT_DATE, 1, pii_count)
  ON CONFLICT (user_id, day)
  DO UPDATE SET
    requests = daily_stats.requests + 1,
    pii_detected = daily_stats.pii_detected + EXCLUDED.pii_detected;

  INSERT INTO public.user_stats (user_id, total_requests, total_pii_detected)
  VALUES (auth.uid(), 1, pii_count)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_requests = user_stats.total_requests + 1,
    total_pii_detected = user_stats.total_pii_detected + pii_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_protection_event(INTEGER) TO authenticated;

-- RPC to update average latency
CREATE OR REPLACE FUNCTION public.update_avg_latency(new_latency INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, avg_latency_ms)
  VALUES (auth.uid(), new_latency)
  ON CONFLICT (user_id)
  DO UPDATE SET avg_latency_ms = new_latency;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_avg_latency(INTEGER) TO authenticated;
