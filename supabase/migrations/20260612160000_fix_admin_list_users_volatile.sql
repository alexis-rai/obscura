-- Fix: STABLE functions cannot modify data. Change to VOLATILE.
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Deactivate accounts whose subscription_ends_at has passed
  UPDATE public.profiles
  SET subscription_status = 'inactive'
  WHERE subscription_status = 'active'
    AND subscription_ends_at IS NOT NULL
    AND subscription_ends_at < NOW();

  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END;
$$;
