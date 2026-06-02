-- Indexed email existence check for login UX.
-- Called after a failed signInWithPassword to distinguish "wrong password"
-- from "no account exists" without using the admin API or full table scans.
-- SECURITY DEFINER lets the function access auth.users as postgres
-- while being callable via the anon key from a server action.
CREATE OR REPLACE FUNCTION public.check_email_registered(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(p_email)
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_email_registered(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_registered(text) TO authenticated;
