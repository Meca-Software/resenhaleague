'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSystemUser(data: { email: string, username: string, password_hash: string, role_id: string, role: string }) {
  const supabase = await createAdminClient()

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password_hash,
    email_confirm: true,
    user_metadata: {
      username: data.username,
      role: data.role
    }
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  if (!authData.user) {
    return { success: false, error: "Falha ao criar usuário no Auth." }
  }

  // 2. Insert into system_users using the new Auth User ID
  const { error: dbError } = await supabase.from('system_users').insert({
    id: authData.user.id,
    email: data.email,
    username: data.username,
    role_id: data.role_id,
    role: data.role
  })

  if (dbError) {
    // Rollback Se falhar o insert no DB
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: dbError.message }
  }

  revalidatePath('/admin/contas')
  return { success: true }
}

export async function deleteSystemUser(id: string) {
  const supabase = await createAdminClient()

  // A tabela system_users será excluída automaticamente via Trigger no DB se atrelarmos,
  // ou podemos excluir direto no Auth que o cascade resolve.
  // Como não criamos trigger ainda, excluímos de ambos.
  
  // Deletar do Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(id)
  if (authError) {
    return { success: false, error: authError.message }
  }

  // Deletar do DB Público
  const { error: dbError } = await supabase.from('system_users').delete().eq('id', id)
  if (dbError) {
    return { success: false, error: dbError.message }
  }

  revalidatePath('/admin/contas')
  return { success: true }
}

export async function lookupEmailByUsername(username: string) {
  const supabase = await createAdminClient();
  
  // Como as tabelas estão protegidas via RLS, o createAdminClient (Service Role Key) 
  // pode ignorar RLS e achar o email pelo username.
  const { data, error } = await supabase
    .from('system_users')
    .select('email')
    .eq('username', username)
    .single();

  if (error || !data) {
    return null;
  }

  return data.email;
}
