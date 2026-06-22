-- Reset Completo - Resenha League
-- CUIDADO: Este script APAGA TODOS OS DADOS EXISTENTES e recria o banco do zero.
-- Cole e rode este script no SQL Editor do seu painel Supabase.

-- 1. APAGAR TUDO (CLEANUP)
DROP TABLE IF EXISTS public.pilot_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.hall_of_fame CASCADE;
DROP TABLE IF EXISTS public.regulations CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.penalties CASCADE;
DROP TABLE IF EXISTS public.incidents CASCADE;
DROP TABLE IF EXISTS public.race_results CASCADE;
DROP TABLE IF EXISTS public.qualifying_results CASCADE;
DROP TABLE IF EXISTS public.races CASCADE;
DROP TABLE IF EXISTS public.seasons CASCADE;
DROP TABLE IF EXISTS public.championships CASCADE;
DROP TABLE IF EXISTS public.pilots CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.system_users CASCADE;

DROP TYPE IF EXISTS penalty_type CASCADE;
DROP TYPE IF EXISTS incident_status CASCADE;
DROP TYPE IF EXISTS race_status CASCADE;
DROP TYPE IF EXISTS championship_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'steward', 'moderator', 'pilot', 'user');
CREATE TYPE championship_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
CREATE TYPE race_status AS ENUM ('upcoming', 'in_progress', 'completed', 'cancelled');
CREATE TYPE incident_status AS ENUM ('pending', 'investigating', 'accepted', 'rejected', 'resolved');
CREATE TYPE penalty_type AS ENUM ('warning', 'time_penalty', 'grid_penalty', 'points_deduction', 'disqualification');

-- 3. SYSTEM USERS (Independent from Supabase Auth)
CREATE TABLE public.system_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'user'::user_role NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TEAMS
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PILOTS
CREATE TABLE public.pilots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.system_users(id) ON DELETE SET NULL UNIQUE,
    name TEXT NOT NULL,
    game_id TEXT, -- PSN/Xbox/Steam ID
    nationality TEXT,
    number INTEGER,
    current_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    stats JSONB DEFAULT '{}'::jsonb, -- Cache of wins, poles, podiums
    description TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CHAMPIONSHIPS & SEASONS
CREATE TABLE public.championships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    tier INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.seasons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    championship_id UUID REFERENCES public.championships(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Season 5"
    start_date DATE,
    end_date DATE,
    status championship_status DEFAULT 'upcoming'::championship_status,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. RACES
CREATE TABLE public.races (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "GP do Brasil"
    circuit TEXT NOT NULL,
    country_flag TEXT,
    race_date TIMESTAMP WITH TIME ZONE,
    laps INTEGER,
    weather TEXT,
    status race_status DEFAULT 'upcoming'::race_status,
    round_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. RESULTS
CREATE TABLE public.qualifying_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    race_id UUID REFERENCES public.races(id) ON DELETE CASCADE,
    pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    q1_time TEXT,
    q2_time TEXT,
    q3_time TEXT,
    best_time TEXT,
    tyre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(race_id, pilot_id)
);

CREATE TABLE public.race_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    race_id UUID REFERENCES public.races(id) ON DELETE CASCADE,
    pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    position INTEGER NOT NULL,
    grid_position INTEGER,
    total_time TEXT,
    fastest_lap TEXT,
    points NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'finished', -- finished, dnf, dsq
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(race_id, pilot_id)
);

-- 9. STEWARDS (INCIDENTS & PENALTIES)
CREATE TABLE public.incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    race_id UUID REFERENCES public.races(id) ON DELETE CASCADE,
    reporting_pilot_id UUID REFERENCES public.pilots(id) ON DELETE SET NULL,
    involved_pilot_id UUID REFERENCES public.pilots(id) ON DELETE SET NULL,
    lap INTEGER,
    description TEXT NOT NULL,
    video_url TEXT,
    status incident_status DEFAULT 'pending'::incident_status,
    steward_notes TEXT,
    official_decision TEXT,
    penalty TEXT,
    license_points INTEGER DEFAULT 0,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.penalties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE,
    type penalty_type NOT NULL,
    value NUMERIC, -- e.g., 5 (seconds), 3 (positions)
    description TEXT,
    applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. BADGES
CREATE TABLE public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.pilot_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT false,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pilot_id, badge_id)
);

-- 11. NEWS & CONTENT
CREATE TABLE public.news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    cover_url TEXT,
    author_id UUID REFERENCES public.system_users(id) ON DELETE SET NULL,
    category TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.regulations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.hall_of_fame (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- champion, record
    title TEXT NOT NULL,
    pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. INITIAL SUPER ADMIN ACCOUNT & SEED DATA
INSERT INTO public.system_users (email, username, password_hash, role, full_name) VALUES 
('admin@resenhaleague.com', 'canis.admin', 'admin@canis', 'superadmin', 'Super Administrador');

-- 13. PERMISSIONS (GRANTS) PARA A API DO SUPABASE
-- Concede permissões de acesso ao esquema public para as roles da API
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
