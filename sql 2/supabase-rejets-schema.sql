-- =====================================================
-- GSET PLANS - Rejets (Rejections) Table Schema
-- =====================================================
-- Execute this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- 1. REJETS TABLE
CREATE TABLE IF NOT EXISTS public.rejets (
  id SERIAL PRIMARY KEY,
  periode TEXT NOT NULL,
  semaine TEXT,
  nd TEXT,
  prenom_technicien TEXT NOT NULL,
  nom_technicien TEXT,
  type_rejet TEXT,
  motif TEXT,
  date_rejet DATE,
  date_intervention DATE,
  commentaire TEXT,
  statut TEXT DEFAULT 'en_attente',
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la semaine
CREATE INDEX IF NOT EXISTS idx_rejets_semaine ON public.rejets(semaine);
-- Index pour le statut
CREATE INDEX IF NOT EXISTS idx_rejets_statut ON public.rejets(statut);

ALTER TABLE public.rejets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rejets viewable by authenticated"
  ON public.rejets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage rejets"
  ON public.rejets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('dir', 'superadmin')));

-- 2. REJETS IMPORTS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.rejets_imports (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  periode TEXT NOT NULL,
  total_records INTEGER DEFAULT 0,
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rejets_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rejets imports viewable by authenticated"
  ON public.rejets_imports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage rejets imports"
  ON public.rejets_imports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('dir', 'superadmin')));

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_rejets_periode ON public.rejets(periode);
CREATE INDEX IF NOT EXISTS idx_rejets_prenom_technicien ON public.rejets(prenom_technicien);
CREATE INDEX IF NOT EXISTS idx_rejets_date_rejet ON public.rejets(date_rejet);
CREATE INDEX IF NOT EXISTS idx_rejets_year_month ON public.rejets(year, month);

-- =====================================================
-- MIGRATION: Ajouter colonne semaine si table existe déjà
-- =====================================================
-- Exécutez cette commande si la table rejets existe déjà sans la colonne semaine:
-- ALTER TABLE public.rejets ADD COLUMN IF NOT EXISTS semaine TEXT;
-- CREATE INDEX IF NOT EXISTS idx_rejets_semaine ON public.rejets(semaine);
