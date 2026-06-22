CREATE TABLE public.race_attendances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    race_id UUID REFERENCES public.races(id) ON DELETE CASCADE,
    pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(race_id, pilot_id)
);

ALTER TABLE public.pilots ADD COLUMN is_reserve BOOLEAN DEFAULT false;

ALTER TABLE public.race_attendances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to race_attendances" ON public.race_attendances FOR SELECT USING (true);
