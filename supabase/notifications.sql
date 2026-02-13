-- Migration: Ajouter système de notifications
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Politique: les utilisateurs peuvent voir leurs notifications + notifications globales (user_id null)
CREATE POLICY "Users can view own and global notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 5. Politique: seuls les admins peuvent créer des notifications
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'dir')
    )
  );

-- 6. Politique: les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 7. Politique: les utilisateurs peuvent supprimer leurs notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Fonction pour créer une notification (à appeler depuis le backend)
CREATE OR REPLACE FUNCTION public.notify(
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (type, title, message, user_id, data)
  VALUES (p_type, p_title, p_message, p_user_id, p_data)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- 9. Activer Realtime pour les notifications (optionnel, pour temps réel)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 10. Exemple: Trigger pour notifier lors d'un nouvel import
CREATE OR REPLACE FUNCTION public.notify_on_import()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.notify(
    'import',
    'Nouvel import effectué',
    'Fichier: ' || NEW.filename || ' (' || NEW.total_records || ' enregistrements)',
    NULL,
    jsonb_build_object('import_id', NEW.id, 'type', NEW.type)
  );
  RETURN NEW;
END;
$$;

-- Décommenter pour activer la notification automatique sur les imports
-- CREATE TRIGGER on_import_created
--   AFTER INSERT ON public.imports
--   FOR EACH ROW EXECUTE FUNCTION public.notify_on_import();

-- 11. Commentaires
COMMENT ON TABLE public.notifications IS 'Système de notifications pour les utilisateurs';
COMMENT ON COLUMN public.notifications.type IS 'Type: info, success, warning, error, import';
COMMENT ON COLUMN public.notifications.user_id IS 'NULL = notification globale pour tous';
COMMENT ON COLUMN public.notifications.data IS 'Données additionnelles en JSON';
