-- Add extension encryption counter to profiles
ALTER TABLE public.profiles
ADD COLUMN extension_encrypts INTEGER NOT NULL DEFAULT 0;

-- RPC function to increment the counter (called by the Chrome extension)
CREATE OR REPLACE FUNCTION public.increment_extension_encrypts(count INTEGER DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET extension_encrypts = extension_encrypts + count,
      updated_at = now()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_extension_encrypts(INTEGER) TO authenticated;
