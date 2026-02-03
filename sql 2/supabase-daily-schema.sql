-- =====================================================
-- GSET PLANS - Daily Tracking (Suivi Journalier)
-- =====================================================
-- Exécute ce script dans Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Coller > Run
-- =====================================================

-- 1. TABLE SUIVI JOURNALIER
CREATE TABLE IF NOT EXISTS public.daily_tracking (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('CANAL', 'ORANGE')),
  technicien TEXT NOT NULL,
  date DATE NOT NULL,
  etat TEXT DEFAULT 'N/A',
  planifies INTEGER DEFAULT 0,
  realises INTEGER DEFAULT 0,
  ok INTEGER DEFAULT 0,
  nok INTEGER DEFAULT 0,
  reportes INTEGER DEFAULT 0,
  taux_reussite DECIMAL(5,4) DEFAULT 0,
  taux_echec DECIMAL(5,4) DEFAULT 0,
  taux_report DECIMAL(5,4) DEFAULT 0,
  taux_cloture DECIMAL(5,4) DEFAULT 0,
  periode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Contrainte unicité: un seul enregistrement par technicien/date/type
  UNIQUE(technicien, date, type)
);

-- 2. ACTIVER RLS (Row Level Security)
ALTER TABLE public.daily_tracking ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
-- Tout le monde authentifié peut voir
CREATE POLICY "Daily tracking viewable by authenticated"
  ON public.daily_tracking FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les admins (dir) peuvent insérer
CREATE POLICY "Admins can insert daily tracking"
  ON public.daily_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir')
  );

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can update daily tracking"
  ON public.daily_tracking FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir')
  );

-- Seuls les admins peuvent supprimer
CREATE POLICY "Admins can delete daily tracking"
  ON public.daily_tracking FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir')
  );

-- 4. INDEX pour performances
CREATE INDEX IF NOT EXISTS idx_daily_tracking_date ON public.daily_tracking(date);
CREATE INDEX IF NOT EXISTS idx_daily_tracking_technicien ON public.daily_tracking(technicien);
CREATE INDEX IF NOT EXISTS idx_daily_tracking_type ON public.daily_tracking(type);
CREATE INDEX IF NOT EXISTS idx_daily_tracking_periode ON public.daily_tracking(periode);

-- 5. TABLE IMPORTS SUIVI (historique des imports)
CREATE TABLE IF NOT EXISTS public.daily_imports (
  id SERIAL PRIMARY KEY,
  filename TEXT,
  total_records INTEGER DEFAULT 0,
  date_debut DATE,
  date_fin DATE,
  periode TEXT,
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily imports viewable by authenticated"
  ON public.daily_imports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage daily imports"
  ON public.daily_imports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dir'));

-- 6. FONCTION pour upsert (insert or update)
CREATE OR REPLACE FUNCTION upsert_daily_tracking(
  p_type TEXT,
  p_technicien TEXT,
  p_date DATE,
  p_etat TEXT,
  p_planifies INTEGER,
  p_realises INTEGER,
  p_ok INTEGER,
  p_nok INTEGER,
  p_reportes INTEGER,
  p_taux_reussite DECIMAL,
  p_taux_echec DECIMAL,
  p_taux_report DECIMAL,
  p_taux_cloture DECIMAL,
  p_periode TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_tracking (
    type, technicien, date, etat, planifies, realises, 
    ok, nok, reportes, taux_reussite, taux_echec, 
    taux_report, taux_cloture, periode, created_by
  ) VALUES (
    p_type, p_technicien, p_date, p_etat, p_planifies, p_realises,
    p_ok, p_nok, p_reportes, p_taux_reussite, p_taux_echec,
    p_taux_report, p_taux_cloture, p_periode, auth.uid()
  )
  ON CONFLICT (technicien, date, type) 
  DO UPDATE SET
    etat = EXCLUDED.etat,
    planifies = EXCLUDED.planifies,
    realises = EXCLUDED.realises,
    ok = EXCLUDED.ok,
    nok = EXCLUDED.nok,
    reportes = EXCLUDED.reportes,
    taux_reussite = EXCLUDED.taux_reussite,
    taux_echec = EXCLUDED.taux_echec,
    taux_report = EXCLUDED.taux_report,
    taux_cloture = EXCLUDED.taux_cloture,
    periode = EXCLUDED.periode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RÉSUMÉ DES TABLES CRÉÉES:
-- - daily_tracking : données de suivi journalier
-- - daily_imports : historique des imports
-- =====================================================
