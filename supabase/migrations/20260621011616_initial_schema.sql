-- Adiciona campo description em pilots
ALTER TABLE public.pilots ADD COLUMN IF NOT EXISTS description TEXT;

-- Criação da tabela de badges
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criação da tabela de relacionamento pilot_badges
CREATE TABLE IF NOT EXISTS public.pilot_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pilot_id, badge_id)
);

-- Habilitar RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_badges ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'badges' AND policyname = 'Allow public read access to badges'
    ) THEN
        CREATE POLICY "Allow public read access to badges" ON public.badges FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'pilot_badges' AND policyname = 'Allow public read access to pilot_badges'
    ) THEN
        CREATE POLICY "Allow public read access to pilot_badges" ON public.pilot_badges FOR SELECT USING (true);
    END IF;
END
$$;
