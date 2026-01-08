-- Create enum for case types
CREATE TYPE public.case_type AS ENUM ('criminal', 'civil');

-- Create enum for case status
CREATE TYPE public.case_status AS ENUM ('pending', 'active', 'hearing', 'verdict_pending', 'closed', 'appealed');

-- Create cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  unique_identifier TEXT NOT NULL,
  case_type case_type NOT NULL,
  party_a_name TEXT NOT NULL,
  party_b_name TEXT NOT NULL,
  assigned_judge_id UUID REFERENCES public.profiles(id),
  lawyer_party_a_id UUID REFERENCES public.profiles(id),
  lawyer_party_b_id UUID REFERENCES public.profiles(id),
  status case_status NOT NULL DEFAULT 'pending',
  court_name TEXT,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Policies for cases
CREATE POLICY "Authenticated users can view cases"
ON public.cases
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Clerks can insert cases"
ON public.cases
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Clerks can update cases"
ON public.cases
FOR UPDATE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Generate case number function
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('case_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create sequence for case numbers
CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1;

-- Trigger to auto-generate case number
CREATE TRIGGER generate_case_number_trigger
BEFORE INSERT ON public.cases
FOR EACH ROW
WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
EXECUTE FUNCTION public.generate_case_number();