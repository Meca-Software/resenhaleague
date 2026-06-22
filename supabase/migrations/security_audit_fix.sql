-- ==============================================================================
-- BLINDAGEM DE SEGURANÇA FINAL (RLS - Row Level Security)
-- Rode isso no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. ATIVAR RLS NAS TABELAS VULNERÁVEIS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;


-- 2. CRIAR POLÍTICAS DE LEITURA (PÚBLICA PARA O SITE FUNCIONAR)
-- (Qualquer pessoa acessando o site pode ver o conteúdo)

DROP POLICY IF EXISTS "Public read access for teams" ON public.teams;
CREATE POLICY "Public read access for teams" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for pilots" ON public.pilots;
CREATE POLICY "Public read access for pilots" ON public.pilots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for championships" ON public.championships;
CREATE POLICY "Public read access for championships" ON public.championships FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for seasons" ON public.seasons;
CREATE POLICY "Public read access for seasons" ON public.seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for races" ON public.races;
CREATE POLICY "Public read access for races" ON public.races FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for race_results" ON public.race_results;
CREATE POLICY "Public read access for race_results" ON public.race_results FOR SELECT USING (true);


-- 3. CRIAR POLÍTICAS DE ESCRITA (APENAS PARA ADMINS E SUPERADMINS)
-- O Supabase Auth guarda o 'role' (cargo) da pessoa criptografado no token JWT dela.
-- Se o JWT não disser que é superadmin ou admin, o banco bloqueia qualquer tentativa de INSERT/UPDATE/DELETE.

DROP POLICY IF EXISTS "Admins can modify teams" ON public.teams;
CREATE POLICY "Admins can modify teams" ON public.teams
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' IN ('superadmin', 'admin'));

DROP POLICY IF EXISTS "Admins can modify pilots" ON public.pilots;
CREATE POLICY "Admins can modify pilots" ON public.pilots
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' IN ('superadmin', 'admin'));

DROP POLICY IF EXISTS "Admins can modify championships" ON public.championships;
CREATE POLICY "Admins can modify championships" ON public.championships
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' IN ('superadmin', 'admin'));

DROP POLICY IF EXISTS "Admins can modify seasons" ON public.seasons;
CREATE POLICY "Admins can modify seasons" ON public.seasons
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' IN ('superadmin', 'admin'));

-- Corridas e Resultados podem ser mexidos por Superadmins, Admins e Comissários (Stewards)
DROP POLICY IF EXISTS "Admins and Stewards can modify races" ON public.races;
CREATE POLICY "Admins and Stewards can modify races" ON public.races
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' IN ('superadmin', 'admin', 'steward'));

DROP POLICY IF EXISTS "Admins and Stewards can modify race_results" ON public.race_results;
CREATE POLICY "Admins and Stewards can modify race_results" ON public.race_results
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' IN ('superadmin', 'admin', 'steward'));


-- ==============================================================================
-- FIM - Seu banco agora está protegido contra injeções de dados pelo lado do cliente!
-- ==============================================================================
