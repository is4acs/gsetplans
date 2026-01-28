-- =====================================================
-- GSET PLANS - Supabase Database Schema
-- =====================================================
-- Execute this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- 1. USERS TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('dir', 'tech')),
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'dir'
    )
    OR NOT EXISTS (SELECT 1 FROM public.profiles)
  );

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'dir'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'dir'
    )
  );

-- 2. ORANGE PRICES TABLE
CREATE TABLE IF NOT EXISTS public.orange_prices (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  gset_price DECIMAL(10,2) NOT NULL,
  tech_price DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orange_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orange prices viewable by authenticated"
  ON public.orange_prices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage orange prices"
  ON public.orange_prices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir'));

-- Insert default Orange prices
INSERT INTO public.orange_prices (code, gset_price, tech_price) VALUES
  ('LSIM1', 111.00, 61.05),
  ('LSIM2', 99.91, 54.95),
  ('LSIM3', 66.60, 36.63),
  ('LSOU1', 217.56, 119.66),
  ('LSOU2', 195.36, 107.45),
  ('LSOU3', 130.98, 72.04),
  ('LSA1', 288.60, 158.73),
  ('LSA2', 259.14, 142.84),
  ('LSA3', 163.17, 89.74),
  ('ETCFO', 74.93, 41.21),
  ('ETCFO1', 74.93, 41.21),
  ('PLP1', 78.92, 43.86),
  ('PLP2', 79.92, 43.86),
  ('PLP3', 80.96, 43.86),
  ('SAVA1', 73.26, 40.92),
  ('SAVA2', 65.49, 36.59),
  ('SAVA3', 44.40, 24.42),
  ('PSER1', 87.69, 48.23),
  ('PSER2', 78.81, 43.35),
  ('PSER3', 52.17, 28.69),
  ('SANR', 66.60, 36.63),
  ('PLPS', 30.52, 16.79)
ON CONFLICT (code) DO NOTHING;

-- 3. CANAL PRICES TABLE
CREATE TABLE IF NOT EXISTS public.canal_prices (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  gset_price DECIMAL(10,2) NOT NULL,
  tech_price DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.canal_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Canal prices viewable by authenticated"
  ON public.canal_prices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage canal prices"
  ON public.canal_prices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir'));

-- Insert default Canal+ prices
INSERT INTO public.canal_prices (code, gset_price, tech_price) VALUES
  ('AERC', 117.45, 70.47),
  ('BPMS', 84.40, 50.64),
  ('CHRC', 169.50, 101.70),
  ('FARC', 156.60, 93.96),
  ('INRC', 139.26, 83.56),
  ('PBEA', 288.77, 173.26),
  ('PBEC', 201.30, 120.78),
  ('PBEF', 280.15, 168.09),
  ('PBIS', 176.12, 105.67),
  ('PDOS', 89.00, 53.40),
  ('SAVD', 240.00, 144.00),
  ('SAVS', 73.87, 44.32),
  ('SAVG', 73.87, 44.32),
  ('TXPA', 119.00, 71.40),
  ('TXPB', 178.50, 107.10),
  ('TXPC', 373.10, 223.86),
  ('TXPD', 174.20, 104.52)
ON CONFLICT (code) DO NOTHING;

-- 4. ORANGE INTERVENTIONS TABLE
CREATE TABLE IF NOT EXISTS public.orange_interventions (
  id SERIAL PRIMARY KEY,
  periode TEXT NOT NULL,
  nd TEXT,
  tech TEXT NOT NULL,
  articles TEXT,
  montant_st DECIMAL(10,2) NOT NULL,
  date_debut TIMESTAMPTZ,
  date_fin TIMESTAMPTZ,
  intervention_date DATE,
  week_number INTEGER,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orange_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orange interventions viewable by authenticated"
  ON public.orange_interventions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage orange interventions"
  ON public.orange_interventions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir'));

-- 5. CANAL INTERVENTIONS TABLE
CREATE TABLE IF NOT EXISTS public.canal_interventions (
  id SERIAL PRIMARY KEY,
  periode TEXT NOT NULL,
  tech TEXT NOT NULL,
  tech_name TEXT,
  ref_pxo TEXT,
  facturation TEXT,
  agence TEXT,
  montant_gset DECIMAL(10,2) NOT NULL,
  montant_tech DECIMAL(10,2) NOT NULL,
  date_solde TIMESTAMPTZ,
  date_validation TIMESTAMPTZ,
  intervention_date DATE,
  week_number INTEGER,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.canal_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Canal interventions viewable by authenticated"
  ON public.canal_interventions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage canal interventions"
  ON public.canal_interventions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir'));

-- 6. IMPORTS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.imports (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('orange', 'canal')),
  periode TEXT NOT NULL,
  filename TEXT,
  total_records INTEGER DEFAULT 0,
  total_montant DECIMAL(10,2) DEFAULT 0,
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Imports viewable by authenticated"
  ON public.imports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage imports"
  ON public.imports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir'));

-- 7. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by authenticated"
  ON public.settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir'));

-- 8. HELPER FUNCTION: Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tech')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. CREATE FIRST ADMIN (run this ONCE after setting up)
-- Replace with your actual email
-- You'll need to create this user through Supabase Auth first
-- Then update their role:
-- UPDATE public.profiles SET role = 'dir' WHERE email = 'admin@gset.fr';

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_orange_interventions_periode ON public.orange_interventions(periode);
CREATE INDEX IF NOT EXISTS idx_orange_interventions_tech ON public.orange_interventions(tech);
CREATE INDEX IF NOT EXISTS idx_orange_interventions_date ON public.orange_interventions(intervention_date);
CREATE INDEX IF NOT EXISTS idx_canal_interventions_periode ON public.canal_interventions(periode);
CREATE INDEX IF NOT EXISTS idx_canal_interventions_tech ON public.canal_interventions(tech);
CREATE INDEX IF NOT EXISTS idx_canal_interventions_date ON public.canal_interventions(intervention_date);
