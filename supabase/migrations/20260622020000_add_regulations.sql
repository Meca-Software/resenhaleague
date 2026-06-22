CREATE TABLE IF NOT EXISTS public.regulations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.regulations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies WHERE policyname = 'Regulations are viewable by everyone' AND tablename = 'regulations'
    ) THEN
        CREATE POLICY "Regulations are viewable by everyone" ON public.regulations FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies WHERE policyname = 'Regulations are insertable by admins' AND tablename = 'regulations'
    ) THEN
        CREATE POLICY "Regulations are insertable by admins" ON public.regulations FOR INSERT WITH CHECK (
            exists (select 1 from public.system_users where system_users.id = auth.uid() and system_users.role = 'admin')
        );
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies WHERE policyname = 'Regulations are updatable by admins' AND tablename = 'regulations'
    ) THEN
        CREATE POLICY "Regulations are updatable by admins" ON public.regulations FOR UPDATE USING (
            exists (select 1 from public.system_users where system_users.id = auth.uid() and system_users.role = 'admin')
        );
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies WHERE policyname = 'Regulations are deletable by admins' AND tablename = 'regulations'
    ) THEN
        CREATE POLICY "Regulations are deletable by admins" ON public.regulations FOR DELETE USING (
            exists (select 1 from public.system_users where system_users.id = auth.uid() and system_users.role = 'admin')
        );
    END IF;
END
$$;
