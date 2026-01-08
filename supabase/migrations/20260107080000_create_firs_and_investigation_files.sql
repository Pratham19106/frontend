-- Create FIRs and Investigation Files tables for Police role
BEGIN;

-- Create enum types
DO $$ BEGIN
    CREATE TYPE public.fir_status AS ENUM ('Registered','Under Investigation','Chargesheet Filed','Closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.investigation_file_type AS ENUM ('Supplementary Chargesheet','Forensic Report','Witness Statement');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create firs table
CREATE TABLE IF NOT EXISTS public.firs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fir_number text UNIQUE NOT NULL,
  police_station text NOT NULL,
  informant_name text NOT NULL,
  informant_contact text NOT NULL,
  incident_date timestamptz NOT NULL,
  incident_place text NOT NULL,
  offense_nature text NOT NULL,
  bns_section text NOT NULL,
  accused_name text,
  victim_name text NOT NULL,
  description text,
  status public.fir_status NOT NULL DEFAULT 'Registered',
  created_at timestamptz NOT NULL DEFAULT now(),
  officer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create investigation_files table
CREATE TABLE IF NOT EXISTS public.investigation_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fir_id uuid NOT NULL REFERENCES public.firs(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type public.investigation_file_type NOT NULL,
  notes text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on tables
ALTER TABLE public.firs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_files ENABLE ROW LEVEL SECURITY;

-- Policies: allow anon/public read? We'll restrict: only police role or officer owner can insert/update; anyone authenticated can select? We'll allow select for authenticated with role 'police' or related officer.

-- Policy: Select on firs: allow if jwt contains role='police' OR officer_id matches jwt sub
CREATE POLICY "select_firs_for_police_or_owner" ON public.firs
  FOR SELECT USING (
    (
      current_setting('jwt.claims.role', true) = 'police'
    ) OR (officer_id::text = current_setting('jwt.claims.sub', true))
  );

-- Policy: Insert on firs: only police can insert
CREATE POLICY "insert_firs_police_only" ON public.firs
  FOR INSERT WITH CHECK (
    current_setting('jwt.claims.role', true) = 'police'
  );

-- Policy: Update on firs: only police or officer who created
CREATE POLICY "update_firs_police_or_owner" ON public.firs
  FOR UPDATE USING (
    current_setting('jwt.claims.role', true) = 'police' OR (officer_id::text = current_setting('jwt.claims.sub', true))
  ) WITH CHECK (
    current_setting('jwt.claims.role', true) = 'police' OR (officer_id::text = current_setting('jwt.claims.sub', true))
  );

-- Policy: Delete on firs: only police
CREATE POLICY "delete_firs_police_only" ON public.firs
  FOR DELETE USING (
    current_setting('jwt.claims.role', true) = 'police'
  );

-- Policies for investigation_files: select if police or related to FIR officer
CREATE POLICY "select_investigation_files_police_or_owner" ON public.investigation_files
  FOR SELECT USING (
    current_setting('jwt.claims.role', true) = 'police' OR (
      EXISTS (
        SELECT 1 FROM public.firs f WHERE f.id = fir_id AND (current_setting('jwt.claims.role', true) = 'police' OR f.officer_id::text = current_setting('jwt.claims.sub', true))
      )
    )
  );

-- Insert: only police
CREATE POLICY "insert_investigation_files_police_only" ON public.investigation_files
  FOR INSERT WITH CHECK (
    current_setting('jwt.claims.role', true) = 'police'
  );

-- Update/Delete: only police
CREATE POLICY "modify_investigation_files_police_only" ON public.investigation_files
  FOR ALL USING (current_setting('jwt.claims.role', true) = 'police') WITH CHECK (current_setting('jwt.claims.role', true) = 'police');

COMMIT;
