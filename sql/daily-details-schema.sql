-- =====================================================
-- GSET PLANS - Daily Details (Ventilation des OT)
-- =====================================================
-- Exécute ce script dans Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Coller > Run
-- =====================================================

-- 1. TABLE VENTILATION DES OT
CREATE TABLE IF NOT EXISTS public.daily_details (
  id SERIAL PRIMARY KEY,
  technicien TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ORANGE', 'CANAL')),
  article_code TEXT NOT NULL,
  is_supplement BOOLEAN DEFAULT FALSE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_gset_price DECIMAL(10,2) DEFAULT 0,
  unit_tech_price DECIMAL(10,2) DEFAULT 0,
  total_gset DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_gset_price) STORED,
  total_tech DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_tech_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Un seul enregistrement par technicien/date/type/code
  UNIQUE(technicien, date, type, article_code)
);

-- 2. ACTIVER RLS
ALTER TABLE public.daily_details ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
-- Approche simple : tous les authentifiés peuvent lire,
-- et ils peuvent insérer/modifier/supprimer leurs propres lignes OU si ils sont dir/superadmin

-- Lecture pour tous
CREATE POLICY "daily_details_select"
  ON public.daily_details FOR SELECT
  TO authenticated
  USING (true);

-- Insert : direction/superadmin pour tout, ou created_by = soi-même
CREATE POLICY "daily_details_insert"
  ON public.daily_details FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('dir', 'superadmin')
    )
  );

-- Update : direction/superadmin pour tout, ou propriétaire de la ligne
CREATE POLICY "daily_details_update"
  ON public.daily_details FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('dir', 'superadmin')
    )
  );

-- Delete : direction/superadmin pour tout, ou propriétaire de la ligne
CREATE POLICY "daily_details_delete"
  ON public.daily_details FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('dir', 'superadmin')
    )
  );

-- 4. INDEX pour performances
CREATE INDEX IF NOT EXISTS idx_daily_details_tech_date ON public.daily_details(technicien, date);
CREATE INDEX IF NOT EXISTS idx_daily_details_type ON public.daily_details(type);
CREATE INDEX IF NOT EXISTS idx_daily_details_created_by ON public.daily_details(created_by);

-- =====================================================
-- RÉSUMÉ:
-- - daily_details : ventilation des OT par code article
-- - is_supplement : TRUE pour les travaux supplémentaires Canal+ (TXPA-TXPD)
-- - total_gset/total_tech : colonnes générées automatiquement
-- - RLS : techs modifient leurs propres lignes (via created_by), direction modifie tout
-- =====================================================
