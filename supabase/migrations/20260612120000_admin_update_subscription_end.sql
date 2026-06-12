-- Replace admin_update_user to accept an optional end date parameter.
-- Passing 'never' sets subscription_ends_at to NULL (no expiration).
-- Passing a valid timestamp sets it directly.
-- Passing NULL leaves it unchanged.
CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id UUID,
  new_status TEXT,
  new_ends_at TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles
  SET subscription_status = new_status,
      subscription_started_at = CASE WHEN new_status = 'active' THEN NOW() ELSE subscription_started_at END,
      subscription_ends_at = CASE
        WHEN new_ends_at = 'never' THEN NULL
        WHEN new_ends_at IS NOT NULL THEN new_ends_at::timestamptz
        WHEN new_status = 'active' AND subscription_ends_at IS NULL THEN NOW() + INTERVAL '30 days'
        ELSE subscription_ends_at
      END
  WHERE id = target_user_id;
END;
$$;
