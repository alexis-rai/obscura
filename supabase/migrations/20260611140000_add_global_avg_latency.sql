-- RPC to get the weighted average latency across all users
-- Formula: SUM(avg_latency_ms * total_requests) / SUM(total_requests)
CREATE OR REPLACE FUNCTION public.get_global_avg_latency()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT SUM(avg_latency_ms * total_requests) / NULLIF(SUM(total_requests), 0)
     FROM public.user_stats
     WHERE total_requests > 0 AND avg_latency_ms > 0),
    0
  )::INTEGER;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_avg_latency() TO authenticated;
