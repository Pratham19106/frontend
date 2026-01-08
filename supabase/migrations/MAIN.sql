-- ==============================================================================
--  NYAYSUTRA: MASTER DATABASE SCHEMA
--  Combined: Court Management, Police (FIR), Evidence, Sessions, Notifications
-- ==============================================================================

BEGIN;

-- ==========================================
-- 1. ENUM DEFINITIONS (Safe Creation)
-- ==========================================

DO $$ BEGIN
    CREATE TYPE public.user_role_category AS ENUM ('judiciary', 'legal_practitioner', 'public_party', 'police', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.case_status AS ENUM ('pending', 'active', 'hearing', 'verdict_pending', 'closed', 'appealed', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.case_type AS ENUM ('criminal', 'civil', 'constitutional', 'corporate');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.evidence_category AS ENUM ('document', 'video', 'audio', 'image', 'forensic', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.evidence_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'sealed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.session_status AS ENUM ('active', 'ended', 'paused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.permission_status AS ENUM ('pending', 'granted', 'denied', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Police Specific Enums
DO $$ BEGIN
    CREATE TYPE public.fir_status AS ENUM ('Registered', 'Under Investigation', 'Chargesheet Filed', 'Closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.investigation_file_type AS ENUM ('Supplementary Chargesheet', 'Forensic Report', 'Witness Statement');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ==========================================
-- 2. UTILITY FUNCTIONS
-- ==========================================

-- Function: Auto-update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 3. CORE TABLES (Identity & Structure)
-- ==========================================

-- PROFILES: Extended with 'role' for police compatibility
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT NOT NULL,
  
  -- Role Management
  role_category public.user_role_category NOT NULL DEFAULT 'public_party',
  role text DEFAULT 'citizen', -- Added for compatibility with Police scripts (5.sql)
  
  -- Professional Details
  unique_id TEXT UNIQUE, -- Bar Council ID / Badge Number
  avatar_url TEXT,
  phone TEXT,
  designation TEXT, -- "Senior Advocate", "Inspector"
  bar_council_number TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- COURTS: Physical locations
CREATE TABLE IF NOT EXISTS public.courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE, -- e.g., "DL-HC-01"
  type TEXT DEFAULT 'District Court',
  address TEXT,
  city TEXT,
  state TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SECTIONS: Departments within courts
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Criminal Division"
  code TEXT NOT NULL,
  description TEXT,
  presiding_judge_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(court_id, code)
);


-- ==========================================
-- 4. CASE MANAGEMENT
-- ==========================================

-- CASES: Central record
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE, -- Generated automatically (CASE-YYYY-XXXXXX)
  unique_identifier TEXT NOT NULL, -- Manual Ref ID
  title TEXT NOT NULL,
  description TEXT,
  case_type public.case_type NOT NULL,
  status public.case_status NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  
  -- Parties involved
  party_a_name TEXT NOT NULL, -- Plaintiff
  party_b_name TEXT NOT NULL, -- Defendant
  
  -- Assignments (Nullable for flexibility per 8.sql)
  court_name TEXT, -- Added per 8.sql
  section_id UUID REFERENCES public.sections(id),
  assigned_judge_id UUID REFERENCES public.profiles(id),
  clerk_id UUID REFERENCES public.profiles(id),
  lawyer_party_a_id UUID REFERENCES public.profiles(id),
  lawyer_party_b_id UUID REFERENCES public.profiles(id),
  
  -- Dates
  filing_date DATE DEFAULT CURRENT_DATE,
  next_hearing_date TIMESTAMP WITH TIME ZONE,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CASE DIARY: Audit log
CREATE TABLE IF NOT EXISTS public.case_diary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ==========================================
-- 5. POLICE & FIR SYSTEM
-- ==========================================

-- FIRs Table
CREATE TABLE IF NOT EXISTS public.firs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fir_number text UNIQUE NOT NULL,
  police_station text NOT NULL,
  informant_name text NOT NULL,
  informant_contact text NOT NULL,
  incident_date timestamptz NOT NULL,
  incident_place text NOT NULL,
  offense_nature text NOT NULL,
  bns_section text NOT NULL, -- Bharatiya Nyaya Sanhita
  accused_name text,
  victim_name text NOT NULL,
  description text,
  status public.fir_status NOT NULL DEFAULT 'Registered',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  officer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Investigation Files
CREATE TABLE IF NOT EXISTS public.investigation_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fir_id uuid NOT NULL REFERENCES public.firs(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type public.investigation_file_type NOT NULL,
  notes text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);


-- ==========================================
-- 6. EVIDENCE & CUSTODY
-- ==========================================

-- EVIDENCE
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category public.evidence_category NOT NULL DEFAULT 'document',
  status public.evidence_status DEFAULT 'pending_review',
  
  -- File Details
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  
  -- Security
  is_sealed BOOLEAN DEFAULT false,
  sealed_by UUID REFERENCES public.profiles(id),
  sealed_at TIMESTAMP WITH TIME ZONE,
  
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CHAIN OF CUSTODY
CREATE TABLE IF NOT EXISTS public.chain_of_custody (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- VIEWED, DOWNLOADED, SEALED
  performed_by UUID NOT NULL REFERENCES public.profiles(id),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ==========================================
-- 7. LIVE SESSIONS & NOTIFICATIONS
-- ==========================================

-- SESSION LOGS
CREATE TABLE IF NOT EXISTS public.session_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES public.profiles(id),
    status public.session_status NOT NULL DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PERMISSION REQUESTS (Lawyers asking to speak/upload)
CREATE TABLE IF NOT EXISTS public.permission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.session_logs(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id),
    status public.permission_status NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);


-- ==========================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chain_of_custody ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 8a. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- 8b. Core Court Data (Public Read)
CREATE POLICY "Public view courts" ON public.courts FOR SELECT USING (true);
CREATE POLICY "Public view sections" ON public.sections FOR SELECT USING (true);

-- 8c. Cases Policies
CREATE POLICY "Auth users view cases" ON public.cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users create cases" ON public.cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Assigned users update cases" ON public.cases FOR UPDATE TO authenticated USING (true);

-- 8d. Police (FIR) Policies
-- Police can view all, Officers can view own
CREATE POLICY "police_view_all_firs" ON public.firs FOR SELECT USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (role = 'police' OR role_category = 'police'))) 
  OR (officer_id = auth.uid())
);
-- Only Police can Insert
CREATE POLICY "police_insert_firs" ON public.firs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (role = 'police' OR role_category = 'police'))
);
-- Police or Owner can Update
CREATE POLICY "police_update_firs" ON public.firs FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (role = 'police' OR role_category = 'police')))
  OR (officer_id = auth.uid())
);
-- Only Police can Delete
CREATE POLICY "police_delete_firs" ON public.firs FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (role = 'police' OR role_category = 'police'))
);

-- 8e. Investigation Files Policies
CREATE POLICY "view_files_police_or_owner" ON public.investigation_files FOR SELECT USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (role = 'police' OR role_category = 'police')))
  OR (EXISTS (SELECT 1 FROM public.firs f WHERE f.id = fir_id AND f.officer_id = auth.uid()))
);
CREATE POLICY "manage_files_police_only" ON public.investigation_files FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND (role = 'police' OR role_category = 'police'))
);

-- 8f. Evidence & Notifications
CREATE POLICY "Auth users view evidence" ON public.evidence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users upload evidence" ON public.evidence FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);


-- ==========================================
-- 9. TRIGGERS & AUTOMATION
-- ==========================================

-- 9a. Safe User Creation Trigger (From 3.sql)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  user_full_name text;
  user_role_category text;
  user_unique_id text;
BEGIN
  user_full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User');
  user_role_category := COALESCE(NEW.raw_user_meta_data ->> 'role_category', 'public_party');
  user_unique_id := NEW.raw_user_meta_data ->> 'unique_id';

  INSERT INTO public.profiles (user_id, email, full_name, role_category, unique_id)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role_category::public.user_role_category, -- Try cast
    user_unique_id
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback for text insertion if enum cast fails
    INSERT INTO public.profiles (user_id, email, full_name, role_category, unique_id)
    VALUES (NEW.id, NEW.email, user_full_name, 'public_party', user_unique_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9b. Auto-Generate Case Number (CASE-YYYY-000001)
CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('case_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_case_number_trigger ON public.cases;
CREATE TRIGGER generate_case_number_trigger
BEFORE INSERT ON public.cases
FOR EACH ROW
WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
EXECUTE FUNCTION public.generate_case_number();

-- 9c. Apply Timestamp Updaters
DROP TRIGGER IF EXISTS update_profiles_ts ON public.profiles;
CREATE TRIGGER update_profiles_ts BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cases_ts ON public.cases;
CREATE TRIGGER update_cases_ts BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_evidence_ts ON public.evidence;
CREATE TRIGGER update_evidence_ts BEFORE UPDATE ON public.evidence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_firs_ts ON public.firs;
CREATE TRIGGER update_firs_ts BEFORE UPDATE ON public.firs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- 10. STORAGE BUCKET SETUP
-- ==========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg', 'application/msword']
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Auth users access evidence" ON storage.objects;
CREATE POLICY "Auth users access evidence" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'evidence')
WITH CHECK (bucket_id = 'evidence');

COMMIT;