-- Adicionando campos de controle para o sistema de conquistas (Badges)
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common';
ALTER TABLE public.pilot_badges ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
