-- Fix profiles INSERT policy so the auth trigger can create profiles
BEGIN;

-- Drop existing insert policy if present (supports multiple schema versions)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can insert their own profile' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    DROP POLICY "Users can insert their own profile" ON public.profiles;
  END IF;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Recreate INSERT policy to allow either the user themself OR requests originating from the Supabase service role
-- The auth.role() = 'supabase_admin' branch allows the auth system trigger (or service role operations) to insert the row.
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() = id OR auth.role() = 'supabase_admin'
  );

COMMIT;
