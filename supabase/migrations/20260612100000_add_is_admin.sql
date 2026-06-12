ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.profiles SET is_admin = TRUE WHERE email = 'alexis.raimondi@hotmail.com';
UPDATE public.profiles SET subscription_status = 'active' WHERE email = 'alexis.raimondi@hotmail.com';

-- RPC to list all users (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles
  WHERE (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- RPC to update a user's subscription status (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id UUID,
  new_status TEXT
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
      subscription_ends_at = CASE WHEN new_status = 'active' THEN NOW() + INTERVAL '30 days' ELSE subscription_ends_at END
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user(UUID, TEXT) TO authenticated;

-- RPC to delete a user (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.daily_stats WHERE user_id = target_user_id;
  DELETE FROM public.user_stats WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
