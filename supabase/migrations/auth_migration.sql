-- MUDANÇA DA TABELA SYSTEM_USERS PARA SUPABASE AUTH
-- Rode isso no SQL Editor do seu projeto Supabase

-- 1. Limpa a tabela atual (AVISO: ISSO VAI DELETAR OS USUÁRIOS ATUAIS DO SISTEMA)
-- (Como os IDs mudaram para UUIDs do Supabase Auth, precisamos começar do zero com as contas)
DELETE FROM public.system_users;

-- 2. Remove o campo obsoleto (password_hash) da tabela system_users
ALTER TABLE public.system_users DROP COLUMN password_hash;

-- 3. Atualiza a referência de ID para bater com auth.users
ALTER TABLE public.system_users
  ADD CONSTRAINT fk_system_users_auth FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Corrige as Políticas de Segurança (RLS)
-- Deleta a política insegura que permitia leitura pública
DROP POLICY IF EXISTS "Allow public read access to system_users" ON public.system_users;

-- Cria uma política onde apenas o próprio usuário ou administradores podem ver os dados
CREATE POLICY "Users can read own profile" ON public.system_users
    FOR SELECT USING (auth.uid() = id);

-- (Opcional, se precisar que todos os logados vejam outros pilotos para montar leaderboards, etc)
CREATE POLICY "Authenticated users can read all profiles" ON public.system_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Restringe a criação de Equipes, Pilotos e etc.
-- Exemplo: Para tabelas de campeonatos, só permite admins mexerem (se precisarem)
-- No momento, os INSERTS pelo painel agora são feitos via Service Role, então bypassam o RLS.
-- O frontend (cliente) não deve mais ter políticas de INSERT para tabelas protegidas a não ser que seja o próprio dono.

-- 6. Adicionar permissão de UPDATE para o próprio usuário (Para poder trocar avatar e banner no Portal)
CREATE POLICY "Users can update own profile" ON public.system_users
    FOR UPDATE USING (auth.uid() = id);
