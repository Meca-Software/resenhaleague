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
    role: data.role,
    requires_password_change: true
  })

  if (dbError) {
    // Rollback Se falhar o insert no DB
    await supabase.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: dbError.message }
  }

  revalidatePath('/admin/contas')
  return { success: true }
}

export async function updateSystemUser(id: string, data: { email: string, username: string, password_hash?: string, role_id: string, role: string }) {
  const supabase = await createAdminClient()

  const authUpdatePayload: any = {
    email: data.email,
    user_metadata: {
      username: data.username,
      role: data.role
    }
  }

  if (data.password_hash) {
    authUpdatePayload.password = data.password_hash
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdatePayload)

  if (authError) {
    return { success: false, error: authError.message }
  }

  const { error: dbError } = await supabase.from('system_users')
    .update({
      email: data.email,
      username: data.username,
      role_id: data.role_id,
      role: data.role
    })
    .eq('id', id)

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  revalidatePath('/admin/contas')
  return { success: true }
}

export async function forcePasswordChange(newPassword: string) {
  const supabase = await createClient()

  // Update password in Auth
  const { data: authData, error: authError } = await supabase.auth.updateUser({ password: newPassword })
  
  if (authError || !authData.user) {
    return { success: false, error: authError?.message || 'Erro ao atualizar senha.' }
  }

  // Admin client for bypass RLS if needed, but the user is already authenticated
  // and we probably have RLS policies for them to update their own row.
  // Actually, let's use Admin Client to ensure it works regardless of RLS for this specific flag.
  const adminSupabase = await createAdminClient()
  const { error: dbError } = await adminSupabase
    .from('system_users')
    .update({ requires_password_change: false })
    .eq('id', authData.user.id)

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  // Redirect to their default page based on role
  const role = authData.user.user_metadata?.role || "pilot";
  let targetPath = "/admin";
  if (role === "pilot") {
    targetPath = "/portal";
  } else if (role === "steward") {
    targetPath = "/admin/stewards";
  }

  return { success: true, targetPath }
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
